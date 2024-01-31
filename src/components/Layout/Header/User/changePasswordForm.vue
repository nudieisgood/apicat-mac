<template>
  <div class="change-password-box">
    <a-form
      ref="changePasswordFormRef"
      :model="formState"
      layout="vertical"
      :rules="rules"
    >
      <a-form-item
        ref="oldPassword"
        label="Current password"
        name="oldPassword"
      >
        <a-input-password v-model:value="formState.oldPassword" />
      </a-form-item>
      <a-form-item ref="newPassword" label="New Password" name="newPassword">
        <a-input-password v-model:value="formState.newPassword" />
      </a-form-item>
      <a-form-item
        ref="rePassword"
        label="Confirm new password"
        name="rePassword"
      >
        <a-input-password v-model:value="formState.rePassword" />
      </a-form-item>
      <a-form-item>
        <a-button class="btn-submit" @click.prevent="updatePassword"
          >Update Password</a-button
        >
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import { ref, reactive, nextTick, inject } from "vue";
import { updateUserPassword, ipcLogoutRequest } from "@/js/ipc/userIPC.js";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  components: {},
  setup() {
    const $message = inject("$message");
    const store = useStore();
    const router = useRouter();
    const changePasswordFormRef = ref();
    const formState = reactive({
      oldPassword: "",
      newPassword: "",
      rePassword: "",
    });

    const oldPasswordValidator = async (rule, val) => {
      if (!val) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject("Please enter a current password.");
      }
    };

    const newPasswordValidator = async (rule, val) => {
      if (!val) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject("Please enter a new password.");
      } else if (val === formState.oldPassword) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(
          "The new password is the same as the old password."
        );
      }
    };

    const rePasswordValidator = async (rule, val) => {
      if (!val) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject("Please enter a new password again.");
      } else if (val !== formState.newPassword) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(
          "The confirm password and new password don't match."
        );
      }
    };

    const rules = {
      oldPassword: [
        {
          required: true,
          validator: oldPasswordValidator,
          trigger: "blur",
        },
      ],
      newPassword: [
        {
          required: true,
          validator: newPasswordValidator,
          trigger: "blur",
        },
      ],
      rePassword: [
        {
          required: true,
          validator: rePasswordValidator,
          trigger: "blur",
        },
      ],
    };

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    const logout = async () => {
      const obj = {
        Authorization: `Bearer ${userState.value.token}`,
      };
      store.commit("SET_SHOW_LAYOUT_LOADING_MODE", true);
      const res = await ipcLogoutRequest(obj);
      if (res.code === 20000) {
        router.push("/");
      } else if (res.code === 40011) {
        $message.warning(res.message);
        router.push("/");
      } else {
        $message.warning(res.message);
      }
    };

    const updatePassword = () => {
      changePasswordFormRef.value
        .validate()
        .then(async () => {
          const res = await updateUserPassword(formState);
          if (res.code === 20000) {
            nextTick(() => {
              logout();
              $message.success(
                "Your password has been successfully changed.\n Please login with new password."
              );
            });
          } else {
            $message.warning(res.message);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    return {
      changePasswordFormRef,
      formState,
      rules,
      updatePassword,
      logout,
    };
  },
};
</script>
<style lang="scss" scoped>
.change-password-box {
  &:deep(.ant-form-vertical .ant-form-item) {
    margin-bottom: 6px;
  }

  &:deep(.ant-input) {
    height: 100%;
  }
}

.btn-submit {
  margin-top: 8px;
}
</style>

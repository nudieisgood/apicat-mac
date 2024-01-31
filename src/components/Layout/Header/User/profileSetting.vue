<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="SETTINGS"
      class="setting-modal"
      width="600px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <div class="setting-modal__sidebar">
          <div class="setting-modal__sidebar-container">
            <div
              class="setting-modal__sidebar-item"
              v-for="tab in tabList"
              :key="tab.label"
              :class="{ 'is-active': activeKey === tab.key }"
              @click="changeTab(tab)"
            >
              {{ tab.label }}
            </div>
          </div>
        </div>
        <div class="setting-modal__content">
          <div
            class="setting-modal__profile-content"
            v-if="activeKey === 'profile'"
          >
            <a-form
              ref="editFormRef"
              :model="profileFormState"
              layout="vertical"
            >
              <a-form-item ref="userName" label="User Name" name="userName">
                <a-input v-model:value="profileFormState.userName" />
              </a-form-item>
              <a-form-item class="form-btns">
                <a-button
                  class="btn-submit"
                  @click="updateProfile"
                  :disabled="!profileFormState.userName"
                  >Update Profile</a-button
                >
              </a-form-item>
            </a-form>
          </div>
          <div class="setting-modal__account-content" v-else>
            <a-form
              ref="editFormRef"
              :model="accountFormState"
              layout="vertical"
            >
              <a-form-item ref="account" label="Account" name="account">
                <span>{{ accountFormState.account }}</span>
              </a-form-item>
              <a-form-item ref="summary" label="Password" name="password">
                <a-button
                  class="btn-submit"
                  @click="showChangePasswordForm = true"
                  v-if="!showChangePasswordForm"
                  >Edit Password</a-button
                >
                <change-password-form v-if="showChangePasswordForm" />
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { watch, toRefs, ref, reactive, computed, onMounted, inject } from "vue";
import { updateUserInfo } from "@/js/ipc/userIPC.js";
import ChangePasswordForm from "@/components/Layout/Header/User/changePasswordForm";
import { useStore } from "vuex";

export default {
  components: {
    ChangePasswordForm,
  },
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-setting-dialog": null,
  },
  setup(props, context) {
    const store = useStore();
    const { dialogVisible } = toRefs(props);
    const $message = inject("$message");
    const visible = ref(false);

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    const closeDialog = () => {
      context.emit("close-setting-dialog");
    };

    const tabList = reactive([
      {
        label: "Profile",
        key: "profile",
      },
      {
        label: "Account",
        key: "account",
      },
    ]);

    const activeKey = ref("profile");

    const changeTab = (tab) => {
      activeKey.value = tab.key;
    };

    const profileFormState = reactive({
      userName: "",
    });

    const accountFormState = reactive({
      account: "",
    });

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    onMounted(() => {
      profileFormState.userName = userState.value.userName;
      accountFormState.account = userState.value.account;
    });

    const updateProfile = async () => {
      const updateData = profileFormState;
      const res = await updateUserInfo(updateData);
      if (res.code === 20000) {
        $message.success(res.message);
        store.commit("UPDATE_USER_NAME", res.data.userName);
      } else {
        $message.warning(res.message);
      }
    };

    const showChangePasswordForm = ref(false);

    return {
      visible,
      closeDialog,
      tabList,
      activeKey,
      changeTab,
      profileFormState,
      accountFormState,
      updateProfile,
      showChangePasswordForm,
    };
  },
};
</script>

<style lang="scss" scoped>
.modal {
  &__content {
    // max-height: 340px;
    height: 400px;
    display: flex;
  }
}

.setting-modal {
  &__sidebar {
    flex-basis: 25%;
  }

  &__sidebar-item {
    padding: 2px 0 2px 8px;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    cursor: pointer;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    &:hover {
      background-color: #e8f7ff;
      // background-color: #ffcc3394;
    }
  }

  .is-active {
    background-color: $light-blue;
  }

  &__content {
    overflow-y: scroll;
    padding: 0 20px;
    border-left: 1px solid #e0e0e0;
    flex-basis: 75%;
  }

  &__account-content {
    .ant-form-item {
      &:not(:last-child) {
        margin-bottom: 16px;
      }
    }
  }
}

.form-btns {
  margin-top: 6px;
}
</style>

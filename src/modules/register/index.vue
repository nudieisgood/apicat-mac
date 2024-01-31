<template>
  <div class="register-wrapper">
    <div class="register-container">
      <loading v-if="isShowLoading" />
      <div class="register-form">
        <div class="register-form__header">
          <div class="register-form__logo">
            <img :src="require('@/assets/img/login/icon-logo.svg')" alt="" />
          </div>
        </div>
        <div class="register-form__content">
          <div class="register-form__link" @click="goSignIn">
            <span class="arrow-icon" />
            <span>Sign In</span>
            <!-- <router-link :to="'/'">
              <span class="arrow-icon" /> Sign In</router-link
            > -->
          </div>
          <div class="register-form__main-title">SIGN UP</div>
          <a-form
            ref="registerFormRef"
            :model="formState"
            :rules="rules"
            layout="vertical"
          >
            <a-form-item
              ref="account"
              label="Account"
              name="account"
              class="verify-item"
            >
              <a-input
                v-model:value="formState.account"
                @keyup.enter="register"
                placeholder="example@mail.com"
              />
            </a-form-item>
            <a-form-item
              ref="password"
              label="Password"
              name="password"
              class="verify-item"
            >
              <a-input-password
                v-model:value="formState.password"
                @keyup.enter="register"
              />
            </a-form-item>
            <a-form-item
              ref="userName"
              label="User Name"
              name="userName"
              class="verify-item"
            >
              <a-input
                v-model:value="formState.userName"
                @keyup.enter="register"
              />
            </a-form-item>
            <a-form-item>
              <a-button class="btn-submit" @click="register"
                >Create account</a-button
              >
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, reactive, inject, watch, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ipcRegisterRequest } from "@/js/ipc/userIPC.js";
import Loading from "@/components/Loader/loading";
import store from "@/store";
import Helper from "@/js/utils/helper";

export default {
  components: {
    Loading,
  },
  setup() {
    const $message = inject("$message");
    const router = useRouter();
    const registerFormRef = ref();
    const formState = reactive({
      account: "",
      password: "",
      userName: "",
    });

    const emailVerify = async (_rule, value) => {
      if (!value) {
        return Promise.reject("Please enter a account.");
      } else if (!Helper.emailVerify(value)) {
        return Promise.reject("Account format incorrect.");
      } else {
        return Promise.resolve();
      }
    };

    const rules = {
      account: [
        {
          required: true,
          // message: "Please enter a account.",
          trigger: "blur",
          validator: emailVerify,
        },
      ],
      password: [
        {
          required: true,
          message: "Please enter a password.",
          trigger: "blur",
        },
      ],
      userName: [
        {
          required: true,
          message: "Please enter a username.",
          trigger: "blur",
        },
      ],
    };

    const isShowLoading = ref(false);
    const register = () => {
      registerFormRef.value
        .validate()
        .then(async () => {
          isShowLoading.value = true;
          const submitData = JSON.parse(JSON.stringify(formState));
          const res = await ipcRegisterRequest(submitData);
          isShowLoading.value = false;
          if (res.code === 20000) {
            $message.success(
              "Your account has been successfully created!\n Please check your email to activate your account."
            );
            goSignIn();
          } else {
            $message.warning(res.message);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
    };

    const isAutoSetData = computed(() => {
      return store.getters.isAutoSetData;
    });

    const account = computed(() => {
      return store.getters.getAccount;
    });

    const password = computed(() => {
      return store.getters.getPassword;
    });

    watch(
      () => isAutoSetData,
      () => {
        if (isAutoSetData.value) {
          formState.account = account.value;
          formState.password = password.value;
        }
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {});

    const goSignIn = () => {
      store.commit("UPDATE_IS_KEEP_ACCOUNT_STATUS", true);
      store.commit("KEEP_ACCOUNT", formState.account);
      store.commit("KEEP_PASSWORD", formState.password);
      store.commit("KEEP_USERNAME", formState.userName);
      router.push("/login");
    };

    return {
      registerFormRef,
      formState,
      rules,
      register,
      goSignIn,
      isShowLoading,
      emailVerify,
    };
  },
};
</script>
<style lang="scss" scoped>
.register-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-container {
  position: relative;
  // top: 50%;
  // left: 50%;
  width: 400px;
  height: 600px;
  box-shadow: 1px 3px 8px 2px rgba(0, 0, 0, 0.25);
  background-color: #fff;
  // transform: translate(-50%, -50%);
}

.register-form {
  height: 100%;
  // padding: 25px 30px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    border-radius: 4px 4px 0 0;
    background-color: #1b1515;
  }

  &__logo {
    width: 100%;
    height: 100%;
    text-align: center;
    transform: scale(0.6);

    img {
      // width: 100%;
      height: 100%;
    }
  }

  &__main-title {
    margin-bottom: 30px;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
  }

  &__content {
    position: relative;
    padding: 50px 36px 25px;

    &:deep(.ant-form-vertical) {
      .ant-form-item-label {
        padding: 0;
        line-height: 1.2715;
      }
    }
  }

  &__link {
    position: absolute;
    top: 8px;
    left: 5px;
    display: flex;
    align-items: center;
    cursor: pointer;

    .arrow-icon {
      width: 20px;
      height: 20px;
      display: block;
      margin-right: 5px;
      background-position-y: center;
      background-repeat: no-repeat;
      background-size: contain;
      background-image: url("~@/assets/img/login/icon-left.png");
    }

    a {
      display: flex;
      align-items: center;
      color: $primary-dark-grey;
    }

    &:hover {
      .arrow-icon {
        background-position-y: center;
        background-repeat: no-repeat;
        background-image: url("~@/assets/img/login/icon-left-hover.png");
      }

      a {
        color: $primary-blue;
      }
    }
  }
}

.btn-submit {
  margin-top: 15px;
  width: 100%;
  // color: #ff9224;
  // border-color: #ff9224;

  // &:hover {
  //   color: #fff;
  //   background-color: #ff9224;
  // }
}
</style>

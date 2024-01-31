<template>
  <div class="login-wrapper">
    <div class="login-container">
      <loading v-if="isShowLoading" />
      <div class="login-form">
        <div class="login-form__header">
          <div class="login-form__logo">
            <img :src="require('@/assets/img/login/icon-logo.svg')" alt="" />
          </div>
        </div>
        <div class="login-form__content">
          <div class="login-form__main-title">LOG IN</div>
          <a-form ref="loginFormRef" :model="formState" :rules="rules" layout="vertical">
            <a-form-item ref="account" label="Account" name="account" class="verify-item">
              <a-input v-model:value="formState.account" @keyup.enter="login" />
            </a-form-item>
            <a-form-item ref="password" label="Password" name="password" class="verify-item">
              <a-input-password v-model:value="formState.password" @keyup.enter="login" />
            </a-form-item>
            <a-form-item>
              <div class="login-form__operation">
                <a-checkbox v-model:checked="isKeepAccount" @change="handleChange">Remember Me</a-checkbox>
                <router-link :to="'/resetPassword'" class="btn-forget">Forgot Password?</router-link>
                <!-- <span class="btn-forget" v-if="false">Forgot Password?</span> -->
              </div>
            </a-form-item>
            <a-form-item>
              <a-button class="btn-submit" @click.prevent="login">Log In</a-button>
            </a-form-item>
            <div class="action-list">
              <div class="action-list__item" @click="resendEmail"> Resend Verification Email </div>
              <div class="action-list__item" @click="goSignUp">Sign Up</div>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, reactive, inject, watch, computed } from "vue";
import { ipcLoginRequest, resendConfirmEmail } from "@/js/ipc/userIPC.js";
import { useRouter } from "vue-router";
import Loading from "@/components/Loader/loading";
import store from "@/store";

export default {
  components: {
    Loading,
    // ChangePassword,
  },
  setup() {
    const router = useRouter();
    const $message = inject("$message");

    const loginFormRef = ref();
    const formState = reactive({
      account: "",
      password: "",
    });

    const rules = {
      account: [
        {
          required: true,
          message: "Please enter a account.",
          trigger: "blur",
        },
        // {
        //   min: 3,
        //   max: 5,
        //   message: 'Length should be 3 to 5',
        //   trigger: 'blur',
        // },
      ],
      password: [
        {
          required: true,
          message: "Please enter a password.",
          trigger: "blur",
        },
        // {
        //   min: 3,
        //   max: 5,
        //   message: 'Length should be 3 to 5',
        //   trigger: 'blur',
        // },
      ],
    };

    const isShowLoading = ref(false);
    const login = () => {
      console.log('login')
      loginFormRef.value
        .validate()
        .then(async () => {

          isShowLoading.value = true;
          const submitData = JSON.parse(JSON.stringify(formState));
          console.log('login2')
          const res = await ipcLoginRequest(submitData);
          console.log('login3')
          isShowLoading.value = false;

          if (res.code === 20000) {
            store.commit("UPDATE_AUTO_SET_DATA_STATUS", false);
            // store.commit("user/UPDATE_AUTO_SET_DATA_STATUS", false);

            router.push("/main");
          } else {
            $message.warning(res.message);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
      // loading.value = false
    };

    const isKeepAccount = computed(() => {
      return store.getters.isKeepAccount;
    });

    const handleChange = (e) => {
      if (e.target.checked) {
        store.commit("UPDATE_IS_KEEP_ACCOUNT_STATUS", true);
        store.commit("KEEP_USER_ACCOUNT", formState.account);
      } else {
        store.commit("UPDATE_IS_KEEP_ACCOUNT_STATUS", false);
        store.commit("KEEP_USER_ACCOUNT", "");
      }
    };

    const account = computed(() => {
      return store.getters.getAccount;
    });

    const password = computed(() => {
      return store.getters.getPassword;
    });

    watch(
      () => isKeepAccount,
      () => {
        if (isKeepAccount.value) {
          formState.account = store.getters.getKeepAccount;
        }
      },
      {
        immediate: true,
      }
    );

    const isAutoSetData = computed(() => {
      return store.getters.isAutoSetData;
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

    const goSignUp = () => {
      store.commit("UPDATE_AUTO_SET_DATA_STATUS", true);
      store.commit("KEEP_ACCOUNT", formState.account);
      store.commit("KEEP_PASSWORD", formState.password);
      router.push("/register");
    };

    const resendEmail = async () => {
      isShowLoading.value = true;
      const msg =
        "A new verification has been emailed to you!\n Please check your email to activate your account.";
      const obj = {
        account: formState.account,
      };
      const res = await resendConfirmEmail(obj);
      isShowLoading.value = false;
      if (res.code === 20000) {
        $message.success(msg);
      } else {
        $message.warning(res.message);
      }
    };

    return {
      loginFormRef,
      formState,
      rules,
      login,
      isShowLoading,
      isKeepAccount,
      handleChange,
      goSignUp,
      resendEmail,
    };
  },
};
</script>
<style lang="scss" scoped>
.login-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  position: relative;
  // top: 50%;
  // left: 50%;
  width: 400px;
  height: 600px;
  border-radius: 4px;
  box-shadow: 1px 3px 8px 2px rgba(0, 0, 0, 0.25);
  background-color: #fff;
  // transform: translate(-50%, -50%);
}

.login-form {
  height: 100%;
  // padding: 25px 30px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    margin-bottom: 25px;
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
    padding: 25px 36px;

    &:deep(.ant-form-vertical) {
      .ant-form-item-label {
        padding: 0;
        line-height: 1.2715;
      }
    }
  }

  &__operation {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.ant-spin-nested-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.action-list {
  margin-top: 10px;
  padding-right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__item {
    // text-align: right;
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;

    color: $primary-dark-grey;

    &:hover {
      color: $primary-blue;
    }
  }
}

.btn-forget {
  color: $primary-dark-grey;
  font-size: 12px;
  text-decoration: underline;

  &:hover {
    color: $primary-blue;
  }
}

:deep(.ant-form-item) {
  &:nth-child(3) {
    margin-bottom: 0;
  }

  // &:nth-child(4) {
  //   margin-top: 10px;
  // }
}

:deep(.ant-form-item-control-input) {
  min-height: unset;
}
</style>

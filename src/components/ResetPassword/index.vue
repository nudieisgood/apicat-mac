<template>
  <div class="reset-password-wrapper">
    <div class="reset-password-container">
      <loading v-if="isShowLoading" />
      <div class="reset-password-form" v-if="step === 1">
        <div class="reset-password-form__header">
          <div class="reset-password-form__logo">
            <img :src="require('@/assets/img/login/icon-logo.svg')" alt="" />
          </div>
        </div>
        <div class="reset-password-form__content">
          <div class="reset-password-form__main-title">
            <span class="arrow-icon" @click="goSignIn" />
            <p>FORGOT PASSWORD</p>
          </div>
          <div class="reset-password-form__description">
            <div class="reset-password-form__sub-description">
              Please enter your account, we will send one time password (OTP)
            </div>
          </div>

          <a-form
            ref="sendOTPRef"
            :model="sendOTPFormState"
            :rules="sendOTPRules"
            layout="vertical"
          >
            <a-form-item ref="account" name="account" class="verify-item">
              <a-input
                v-model:value="sendOTPFormState.account"
                @keyup.enter="next"
              />
            </a-form-item>
            <a-form-item>
              <a-button class="btn-submit" @click.prevent="next">NEXT</a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
      <div class="reset-password-form" v-else>
        <div class="reset-password-form__header">
          <div class="reset-password-form__logo">
            <img :src="require('@/assets/img/login/icon-logo.svg')" alt="" />
          </div>
        </div>
        <div class="reset-password-form__content">
          <div class="reset-password-form__main-title">
            <span class="arrow-icon" @click="step = 1" />
            <p>RESET PASSWORD</p>
            <!-- </div> -->
          </div>
          <div class="reset-password-form__description">
            <div class="reset-password-form__sub-description">
              Enter the 6 digit verification code received on your account
              <b>{{ sendOTPFormState.account }}</b>
              <!-- Please enter an one time password (OTP) that send to your account,
              and reset your password -->
              <!-- A OTP(One Time Password) has been sen to
              <b>{{ sendOTPFormState.account }}</b> -->
            </div>
          </div>

          <a-form
            ref="resetPasswordFormRef"
            :model="resetPasswordFormState"
            :rules="resetPasswordRules"
            layout="vertical"
            class="step-2-form"
          >
            <a-form-item
              ref="otpCode"
              name="otpCode"
              class="otp-item verify-item"
            >
              <otp
                :digit-count="6"
                @update:otp="resetPasswordFormState.otpCode = $event"
              />
              <div class="verify-item__mark">
                Didn't receive a OTP?
                <span v-if="isResend">
                  <LoadingOutlined />
                </span>
                <span v-else @click="resendOTP"
                  ><b><u>Resend OTP</u></b></span
                >
              </div>
            </a-form-item>
            <a-form-item
              ref="newPassword"
              name="newPassword"
              class="verify-item"
              label="New password"
            >
              <a-input
                v-model:value="resetPasswordFormState.newPassword"
                @keyup.enter="reset"
              />
            </a-form-item>
            <a-form-item>
              <a-button class="btn-submit" @click.prevent="reset"
                >SUBMIT</a-button
              >
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, reactive, inject } from "vue";
import { sendOTP, resetPassword } from "@/js/ipc/userIPC.js";
import { useRouter } from "vue-router";
import Loading from "@/components/Loader/loading";
import Otp from "@/components/ResetPassword/otp.vue";

export default {
  components: {
    Loading,
    Otp,
  },
  setup() {
    const $message = inject("$message");
    const router = useRouter();

    const sendOTPRef = ref();
    const resetPasswordFormRef = ref();
    const resetPasswordFormState = reactive({
      account: "",
      otpCode: "",
      newPassword: "",
    });

    const sendOTPFormState = reactive({
      account: "",
    });

    const sendOTPRules = {
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
    };

    const resetPasswordRules = {
      otpCode: [
        {
          required: true,
          message: "Please enter code.",
          trigger: "blur",
        },

        // {
        //   min: 3,
        //   max: 5,
        //   message: 'Length should be 3 to 5',
        //   trigger: 'blur',
        // },
      ],
      newPassword: [
        {
          required: true,
          message: "Please enter new password.",
          trigger: "blur",
        },
      ],
    };

    const isShowLoading = ref(false);

    const step = ref(1);
    const next = () => {
      sendOTPRef.value
        .validate()
        .then(async () => {
          isShowLoading.value = true;
          const res = await sendOTP({ account: sendOTPFormState.account });
          isShowLoading.value = false;

          if (res.code === 20000) {
            step.value = 2;
            resetPasswordFormState.account = sendOTPFormState.account;
          } else {
            $message.warning(res.message);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
    };

    const isResend = ref(false);

    const resendOTP = async () => {
      isResend.value = true;
      const res = await sendOTP({ account: sendOTPFormState.account });
      isResend.value = false;

      if (res.code === 20000) {
        $message.success("Your new OTP was resent successfully.");
      } else {
        $message.warning(res.message);
      }
    };

    const reset = () => {
      resetPasswordFormRef.value
        .validate()
        .then(async () => {
          isShowLoading.value = true;
          const obj = {
            account: resetPasswordFormState.account,
            otpCode: resetPasswordFormState.otpCode,
            newPassword: resetPasswordFormState.newPassword,
          };

          const res = await resetPassword(obj);
          isShowLoading.value = false;

          if (res.code === 20000) {
            $message.success(
              "Reset password successfully! Please login in with your new password."
            );

            router.push("/login");
          } else {
            $message.warning(res.message);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
    };

    const goSignIn = () => {
      router.push("/login");
    };

    return {
      resetPasswordFormRef,
      resetPasswordFormState,
      resetPasswordRules,
      isShowLoading,
      next,
      step,
      goSignIn,
      sendOTPRef,
      sendOTPRules,
      sendOTPFormState,
      reset,
      resendOTP,
      isResend,
    };
  },
};
</script>
<style lang="scss" scoped>
.reset-password-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-password-container {
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

.reset-password-form {
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
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 50px;
    font-weight: 600;
    text-align: center;

    p {
      margin: auto;
      font-size: 22px;
    }
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

  &__description {
    margin-bottom: 20px;
    text-align: center;
  }

  &__main-description {
    margin-bottom: 6px;
    font-size: 18px;
    font-weight: 600;
  }

  &__sub-description {
    padding: 0 20px;
    color: $primary-dark-grey;
  }
}

.btn-submit {
  margin-top: 8px;
  width: 100%;
}
.ant-spin-nested-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
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

:deep(.ant-form-vertical) {
  .ant-form-item.verify-item {
    min-height: 48px;
  }
}

.verify-item {
  &__mark {
    text-align: center;
    font-size: 12.5px;
    color: #808080;
    cursor: pointer;
    z-index: 5;

    u {
      color: #333;
    }

    span {
      display: inline-block;
      min-width: 72px;
      text-align: center;
    }
  }
}

.arrow-icon {
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  display: block;
  margin-right: 5px;
  background-position-y: center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("~@/assets/img/login/icon-left.png");
  cursor: pointer;

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-image: url("~@/assets/img/login/icon-left-hover.png");
  }
}

.step-2-form {
  .ant-form-item {
    &.verify-item {
      min-height: 66px;
    }

    &.otp-item {
      min-height: 98px;
      margin-bottom: 12px;
    }
  }
}
</style>

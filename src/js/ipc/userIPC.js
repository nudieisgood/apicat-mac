import helper from "@/js/utils/helper.js";

const electron = window.require("electron");
const { ipcRenderer } = electron;

// 註冊接口
const ipcRegisterRequest = ({ account, password, userName }) => {
  return new Promise((resolve, reject) => {
    const params = { account, password, userName };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("ipc-register-request", arg);
    ipcRenderer.once("ipc-register-request-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 登入接口
const ipcLoginRequest = ({ account, password }) => {
  return new Promise((resolve, reject) => {
    const params = { account, password };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("ipc-login-request", arg);
    ipcRenderer.once("ipc-login-request-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 登出接口
const ipcLogoutRequest = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("ipc-logout-request");
    ipcRenderer.once("ipc-logout-request-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 獲取登入中使用者資料接口
// 若無資料則當前無登入中的使用者
const getUserInformation = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("get-user-information");
    ipcRenderer.once("get-user-information-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 修改個人資料接口
const updateUserInfo = ({ userName }) => {
  return new Promise((resolve, reject) => {
    const params = { userName };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("update-user-info", arg);
    ipcRenderer.once("update-user-info-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 變更密碼
const updateUserPassword = ({ oldPassword, newPassword, rePassword }) => {
  return new Promise((resolve, reject) => {
    const params = { oldPassword, newPassword, rePassword };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("update-user-password", arg);
    ipcRenderer.once("update-user-password-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// Register 重新發送認證信件
const resendConfirmEmail = ({ account }) => {
  return new Promise((resolve, reject) => {
    const params = { account };
    // console.log('params__', params)
    const arg = helper.apiRequestData(params);
    // console.log('arg__', arg)
    ipcRenderer.send("resend-confirm-email", arg);
    ipcRenderer.once("resend-confirm-email-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 沒有透過logout API而被自動導入登入頁時，需清除DB資料
const autoLogout = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("auto-logout");
    ipcRenderer.once("auto-logout-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 發出忘記密碼OTP信件
const sendOTP = ({ account }) => {
  return new Promise((resolve, reject) => {
    const params = { account };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("send-otp", arg);
    ipcRenderer.once("send-otp-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// 忘記密碼重設密碼
const resetPassword = ({ account, otpCode, newPassword }) => {
  return new Promise((resolve, reject) => {
    const params = { account, otpCode, newPassword };
    const arg = helper.apiRequestData(params);
    ipcRenderer.send("reset-password", arg);
    ipcRenderer.once("reset-password-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

export {
  ipcRegisterRequest,
  ipcLoginRequest,
  ipcLogoutRequest,
  getUserInformation,
  updateUserInfo,
  updateUserPassword,
  resendConfirmEmail,
  autoLogout,
  sendOTP,
  resetPassword,
};

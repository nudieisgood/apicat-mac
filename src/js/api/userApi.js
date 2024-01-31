import Api from "@/js/api/api.js";
import {
  createUser,
  getUserInfo,
  removeUser,
  updateUserInfo,
} from "@/js/lokijs/user.js";
import { removeWorkspace } from "@/js/lokijs/workspace.js";
import { removeCookies } from "@/js/lokijs/cookies.js";
import DataTypeEnum from "@/js/enum/dataTypeEnum";

class userApi extends Api {
  static async register(arg) {
    const res = await this.apiRequest(
      "POST",
      "/okman/sign-up",
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    );
    return res;
  }

  static async login(arg) {
    const res = await this.apiRequest(
      "POST",
      "/okman/login",
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      false,
      (res) => {
        createUser(res);
      }
    );
    return res;
  }

  static async logout(arg) {
    const res = await this.apiRequest(
      "GET",
      "/okman/logout",
      {},
      {},
      "",
      true,
      () => {
        removeUser();
        removeWorkspace();
        removeCookies();
      }
    );
    return res;
  }

  static getUserInformation() {
    return getUserInfo().data[0];
  }

  static async updateUserInformation(arg) {
    const res = await this.apiRequest(
      "PATCH",
      "/okman/user-info",
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      (res) => {
        updateUserInfo(res);
      }
    );
    return res;
  }

  static async updateUserPassword(arg) {
    const res = await this.apiRequest(
      "PATCH",
      "/okman/password-reset",
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      true,
      null
    );
    return res;
  }

  static async resendConfirmEmail(arg) {
    const res = await this.apiRequest(
      "POST",
      "/okman/sign-up-confirm-mail-resend",
      {},
      arg,
      DataTypeEnum.URLENCODED.dataType,
      false,
      null
    );
    return res;
  }

  // 沒有透過logout API的情況下被自動帶回登入頁時，需清除DB資料
  static async autoLogout(arg) {
    removeUser();
    removeWorkspace();
    removeCookies();
  }

  // 發出忘記密碼OTP信件
  static async sendOTP(arg) {
    const res = await this.apiRequest(
      "POST",
      "/okman/password-forgot-mail-send",
      {},
      arg,
      DataTypeEnum.URLENCODED.dataType,
      false,
      null
    );
    return res;
  }

  // 忘記密碼重設密碼
  static async resetPassword(arg) {
    const res = await this.apiRequest(
      "PATCH",
      "/okman/password-forgot-reset",
      {},
      arg,
      DataTypeEnum.MULTIPART_FORMDATA.dataType,
      false,
      null
    );
    return res;
  }
}

export default userApi;

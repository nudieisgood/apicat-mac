import { apiRequest } from "@/js/utils/httpRequest.js";
import { getUserInfo, removeUser } from "@/js/lokijs/user.js";
// 先註解
// import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
// 先註解
import DataTypeEnum from "@/js/enum/dataTypeEnum";

class Api {
  static async apiRequest(method, url, header, body, dataType, auth, callback) {
    const reqHeaders = {};
    switch (dataType) {
      case DataTypeEnum.APPLICATION_JSON.dataType:
        reqHeaders["content-type"] = DataTypeEnum.APPLICATION_JSON.rawType;
        break;
      case DataTypeEnum.MULTIPART_FORMDATA.dataType:
        reqHeaders["content-type"] = DataTypeEnum.MULTIPART_FORMDATA.rawType;
        break;
      case DataTypeEnum.URLENCODED.dataType:
        reqHeaders["content-type"] = DataTypeEnum.URLENCODED.rawType;
        break;
      default:
        reqHeaders["content-type"] = DataTypeEnum.APPLICATION_JSON.rawType;
    }
    if (auth && getUserInfo().data.length)
      reqHeaders.Authorization = "Bearer " + getUserInfo().data[0].token;
    // if (auth && getUserInfo().data.length) header.Authorization = 'Bearer ' + getUserInfo().data[0].token
    const data = {
      method,
      url: process.env.VUE_APP_API_BASE + url,
      header: reqHeaders,
      body,
      dataType,
    };

    const response = await apiRequest(data, function (params, header, info) {
      const res = JSON.parse(params);
      if (res.code === 40011) {
        removeUser();
        if (MAIN_WINDOW_WEBPACK_ENTRY) {
          global.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        }
      } else if (res.code === 20000 && callback) {
        callback(res.data);
      }
    });
    return response;
  }
}

export default Api;

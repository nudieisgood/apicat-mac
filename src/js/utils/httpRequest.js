import formurlencoded from "form-urlencoded";
import { createReadStream } from "fs";
import FormData from "form-data";
import axios from "axios";
import { defaultHeaders } from "@/js/config/header";
import helper from "@/js/utils/helper.js";
import DataTypeEnum from "@/js/enum/dataTypeEnum";
import { message } from "ant-design-vue";
// import logger from '@/js/utils/log.js'

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const rawRequest = (body) => {
  const raw = JSON.stringify(body);
  return raw;
};

const formdataRequest = (body) => {
  const formData = new FormData();
  Object.keys(body).forEach((key) => {
    if (body[key] !== undefined) {
      if (body[key]) {
        const startsWithFile = body[key].toString().startsWith("file://");
        if (startsWithFile) {
          const path = body[key].slice("7");
          const stream = createReadStream(path);
          formData.append(key, stream);
        } else {
          if (
            typeof body[key] !== "number" &&
            typeof body[key] !== "string" &&
            typeof body[key] !== "boolean"
          ) {
            formData.append(key, JSON.stringify(body[key]));
          } else {
            formData.append(key, body[key]);
          }
        }
      } else if (body[key] === null) {
        formData.append(key, "");
      } else {
        if (
          typeof body[key] !== "number" &&
          typeof body[key] !== "string" &&
          typeof body[key] !== "boolean"
        ) {
          formData.append(key, JSON.stringify(body[key]));
        } else {
          formData.append(key, body[key]);
        }
      }
    }
  });
  return formData;
};

const urlencodedRequest = (body) => {
  const urlencoded = formurlencoded(body);
  return urlencoded;
};

const getBufLength = (stringifyData) => {
  return Buffer.byteLength(stringifyData);
};

const apiRequest = (arg, callback) => {
  try {
    let httpString = "";
    if (arg.url.includes("://")) {
      httpString = arg.url.split("://")[0];
    } else {
      arg.url = "https://" + arg.url;
      httpString = arg.url.split("://")[0];
    }

    // const port = 9090
    const port = httpString === "http" ? 80 : 443;
    const https = httpString === "http" ? require("http") : require("https");
    const start = new Date();
    const options = {
      port: port,
      method: arg.method,
    };
    let bodyData = null;
    let contentLength = null;

    if (arg.body) {
      switch (arg.dataType) {
        case DataTypeEnum.APPLICATION_JSON.dataType:
          bodyData = rawRequest(arg.body);
          contentLength = getBufLength(bodyData);
          break;
        case DataTypeEnum.MULTIPART_FORMDATA.dataType:
          bodyData = formdataRequest(arg.body);
          options.headers = bodyData.getHeaders();
          // options.headers ={ ...options.headers, ...bodyData.getHeaders()}
          break;
        case DataTypeEnum.URLENCODED.dataType:
          bodyData = urlencodedRequest(arg.body);
          break;
        default:
          break;
      }
    }
    options.headers = { ...arg.header, ...options.headers };

    if (contentLength) {
      options.headers["Content-Length"] = contentLength;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        message.error("Promise timed out after 1 minute");
        reject(new Error("Promise timed out after 1 minute"));
      }, 60 * 1000);
      const req = https.request(arg.url, options, (response) => {
        let data = "";
        response.on("data", function (chunk) {
          data += chunk;
        });
        response.on("end", function () {
          clearTimeout(timer);
          const contentType = response.headers["content-type"];
          const end = new Date();
          const info = {
            bodySize:
              getBufLength(
                contentType.indexOf("application/json") > -1
                  ? JSON.stringify(data)
                  : data,
                "utf8"
              ) / 1024,
            headerSize:
              getBufLength(JSON.stringify(response.headers), "utf8") / 1024,
            time: end - start,
            status: response.statusCode,
          };
          const logData = [response.headers, data];
          helper.logToFile("API After", arg.url, logData);
          // helper.logToFile('API After', arg.url.replace(process.env.VUE_APP_API_BASE, ''), logData)
          callback(data, response.headers, info);
          const responseData =
            contentType.indexOf("application/json") > -1
              ? JSON.parse(data)
              : data;
          resolve(responseData);
        });
        response.on("error", function (error) {
          clearTimeout(timer);
          // console.log('error__', error)
          helper.logToFile("API Error", arg.url, error);
          // helper.logToFile('API Error', arg.url.replace(process.env.VUE_APP_API_BASE, ''), error)
          if (error.code === "ETIMEDOUT") req();
          throw error;
        });
      });

      const logData = [options, arg.body];
      helper.logToFile("API Before", arg.url, logData);
      // helper.logToFile('API Before', arg.url.replace(process.env.VUE_APP_API_BASE, ''), logData)

      switch (arg.dataType) {
        case DataTypeEnum.APPLICATION_JSON.dataType:
          req.write(bodyData);
          req.end();

          break;
        case DataTypeEnum.MULTIPART_FORMDATA.dataType:
          bodyData.pipe(req);
          break;
        case DataTypeEnum.URLENCODED.dataType:
          req.write(bodyData);
          req.end();
          break;
        default:
          req.end();
          break;
      }
    });
  } catch (err) {
    console.log(err);
  }
};

/**
 * @param {Number} response.status - success code === 200; error code === others
 * @param {Object} response.data - response data object
 * staus 為success 時的資料
 * @param {} response.data.data - response data
 * @param {} response.data.headers - response header
 * @param {} response.data.config - response config
 * @param {} response.data.headerSize - response header 資料大小
 * @param {} response.data.bodySize - response body 資料大小
 * @param {} response.data.time - 發送request 到獲得response 所經時間
 * staus 為error 時的資料
 * @param {} response.data.message - error message
 * @param {} response.data.config - error config
 * @param {} response.data.response - error response, 有response 代表請求有獲得回覆
 * @param {} response.data.request - error request, 沒有response 但有request 代表發送請求，但沒有接到回應
 */
const wrapResponse = (responseObject) => {
  // const wrapResponse = (arg) => {
  // const response = {
  //   status: null,
  //   data: {},
  //   logObj: null,
  //   axiosObj2: null,
  //   requestId: obj.requestId
  // }

  // if (!obj.response) {
  //   return response
  // }
  // let arg = obj.response

  // response.status = arg.status
  // response.data.data = arg.data
  // response.data.code = arg.code
  // response.data.headers = arg.headers
  // response.data.headerSize = arg.info? arg.info.headerSize: undefined
  // response.data.bodySize = arg.info? arg.info.bodySize: undefined
  // response.data.time = arg.info?arg.info.time: undefined
  // response.logObj = arg.logData
  // response.axiosObj2 = arg.axiosObj2

  // return response
  return responseObject;
};

let request = null;
let cancelTokens = [];

const httpRequest = async (obj, callback) => {
  let requestLogDetail = {};
  let arg = obj.submitData;
  let requestId = obj.id;
  let bodyData = null;
  let contentLength = null;
  if (arg.body) {
    switch (arg.dataType) {
      case DataTypeEnum.APPLICATION_JSON.dataType:
        bodyData = rawRequest(arg.body);
        contentLength = getBufLength(bodyData);
        break;
      case DataTypeEnum.MULTIPART_FORMDATA.dataType:
        bodyData = formdataRequest(arg.body);
        arg.header = { ...arg.header, ...bodyData.getHeaders() };
        break;
      case DataTypeEnum.URLENCODED.dataType:
        bodyData = urlencodedRequest(arg.body);
        break;
      default:
        break;
    }
  }
  if (contentLength) {
    arg.header["Content-Length"] = contentLength;
  }

  // let a = true
  // if(a) return

  const start = new Date();
  try {
    // arg.header = { ...defaultHeaders, ...arg.header }
    let logData = [arg, bodyData];
    const tempBodyData = JSON.parse(JSON.stringify(bodyData)); // 傳入 helper.debugLogToFile 會被覆蓋，因此複製一份要傳入helper.debugLogToFile的bodyData
    helper.logToFile("API Before", arg.url, logData);
    // helper.logToFile('API Before', arg.url.replace(process.env.VUE_APP_API_BASE, ''), logData)

    // helper.debugLogToFile('API', arg.url.replace(process.env.VUE_APP_API_BASE, ''), arg, bodyData)

    const legalUrl =
      arg.url.startsWith("https://") || arg.url.startsWith("http://");
    if (!legalUrl) arg.url = "https://" + arg.url;

    let axiosObj2 = {
      prettyLog: {},
      rawLog: {
        stream: null,
        requestHeader: null,
        responseHeader: null,
        responseBody: null,
      },
      url: "",
      method: "",
      originalBodyData: arg.body || undefined,
      dataType: arg.dataType,
      responseMeta: null,
      logType: [],
    };

    // 發送請求前做一些處理
    axios.interceptors.request.use(
      function (config) {
        // logger.info('取得發送請求前__', config)
        // const parsedURL = new URL(config.url);
        // config.headers['Host'] = parsedURL.host;
        // config.headers['Content-Length'] = null // 先設定 null，讓 axios 套件自動去計算

        requestLogDetail.title = `${config.method.toUpperCase()} ${config.url}`;

        const { data, url, method, headers } = config;

        if (data) {
          if (data._streams) {
            axiosObj2.rawLog.stream = JSON.parse(JSON.stringify(data._streams));
          }
        }

        axiosObj2.url = url;
        axiosObj2.method = method;
        axiosObj2.prettyLog.requestHeader = headers;

        return config;
      },
      function (error) {
        // 對請求錯誤作處理
        // logger.error('取得發送請求前__', error)
        return Promise.reject(error);
      }
    );

    // 對取得response做處理
    axios.interceptors.response.use(
      function (response) {
        // logger.info('取得response__', response)
        const { request, headers, data } = response;
        requestLogDetail.requestHeaders = request._header;

        requestLogDetail.responseHeaders = headers;
        requestLogDetail.status = response.status;
        requestLogDetail.statusText = response.statusText;
        // logger.info(headers)

        axiosObj2.rawLog.requestHeader = request._header;

        axiosObj2.rawLog.responseHeader = headers;
        axiosObj2.prettyLog.responseHeader = headers;

        const contentType = headers["content-type"];
        if (contentType === "application/json") {
          axiosObj2.rawLog.responseBody = JSON.stringify(
            JSON.parse(response.data)
          );
          axiosObj2.prettyLog.responseBody = JSON.parse(response.data);
        } else {
          axiosObj2.rawLog.responseBody = data;
          axiosObj2.prettyLog.responseBody = data;
        }

        return response;
      },
      function (error) {
        // 對取得錯誤做處理
        // logger.error('對取得錯誤做處理__', error)
        return Promise.reject(error);
      }
    );

    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    request = { cancel: source.cancel };
    let sourceObject = {
      requestId,
      request,
    };
    cancelTokens.push(sourceObject);

    // 先讓 axios 去自動計算
    delete arg.header["Content-Length"];
    delete arg.header["Host"];

    const response = await axios({
      headers: arg.header,
      method: arg.method,
      url: arg.url,
      data: bodyData,
      responseType: "arraybuffer",
      cancelToken: source.token,
      // timeout: 1000 * 10 // NOTE: 通常不用設定
    });

    // logger.info('Size of response data:', response.data.byteLength, 'bytes')

    const contentType = response.headers["content-type"];
    const mimeType = contentType ? contentType.split(";")[0] : "text/plain";

    const decoder = new TextDecoder("utf-8"); // 使用 UTF-8 編碼解析數據

    let formatData = response.data;

    try {
      const text = decoder.decode(response.data); // 解析數據
      // logger.info('解析為文本成功:')

      if (mimeType.includes("text") || mimeType.includes("octet-stream")) {
        formatData = text;
      } else if (mimeType.includes("json")) {
        formatData = JSON.parse(text);
      }
    } catch (error) {
      // logger.error(error)
      // logger.info('無法解析為文本:', error)
    }

    requestLogDetail.responseBody = formatData;

    // if (mimeType.includes('text')) {
    //   formatData = decoder.decode(response.data)

    // } else if (mimeType.includes('json')) {
    //   formatData = JSON.parse(response.data)
    // }

    logData = [response.headers, formatData];
    helper.logToFile("API After", arg.url, logData);
    // helper.logToFile('API After', arg.url.replace(process.env.VUE_APP_API_BASE, ''), logData)

    const end = new Date();
    const info = {
      bodySize: getBufLength(JSON.stringify(response.data), "utf8") / 1024,
      headerSize: getBufLength(JSON.stringify(response.headers), "utf8") / 1024,
      time: end - start,
    };
    response.info = info;
    let objTest = {
      arrayBufferData: response.data,
      status: response.status,
      data: formatData,
      code: response.code,
      headers: response.headers,
      info: info,
      headerSize: info.headerSize,
      bodySize: info.bodySize,
      time: info.time,
      statusText: response.statusText,
      method: response.config.method,
      url: response.config.url,
      // NOTE: 2023/12/13 以下為無法被序列化的資料，若需傳回主進程，需處理，不然後續無法執行 ↓
      // config: {
      //   headers: response.config.headers,
      //   method: response.config.method,
      //   url: response.config.url,
      //   proxy: response.config.proxy,
      //   data: response.config.data
      // },
      // requestHeaders: response.config.headers,

      // proxy: response.config.proxy,
      // requestData: response.config.data
      // ↑
    };
    axiosObj2.responseMeta = info;
    axiosObj2.logType = ["log", "network"];
    requestLogDetail.time = info.time;
    requestLogDetail.bodySize = info.bodySize;
    // logger.info('requestLogDetail__', requestLogDetail)

    const obj = {
      prettyRequestBody: arg.body || undefined,
      prettyRequestHeader: arg.header,
      prettyRequest: arg,
      rawRequestBody: tempBodyData,
      resHeader: response.headers,
      resBody: response.data,
      prettyResponse: {
        responseHeaders: response.headers,
        responseBody: response.data,
      },
      responseMeta: info,
      logType: ["log", "network"],
    };

    let responseObject = {
      requestId,
      responseData: objTest,
    };

    removeToken(requestId);

    callback(wrapResponse(responseObject));
    // callback(wrapResponse(response))
    response.logData = obj;
    response.axiosObj2 = axiosObj2;
  } catch (error) {
    // logger.error(error)
    if (axios.isCancel(error)) {
      let responseObject = {
        requestId,
        responseData: null,
      };
      callback(wrapResponse(responseObject));
      // removeToken(requestId)
      return;
    }
    const end = new Date();
    if (axios.isAxiosError(error) && !error.status) {
      // if (axios.isAxiosError(error) && error.code === 'ENOTFOUND') {
      const response = {
        status: error.status,
        data: `${error.name}: ${error.message}`,
        code: error.code,
        // data: error.message
      };
      helper.logToFile("API Error", arg.url, response);
      // helper.logToFile('API Error', arg.url.replace(process.env.VUE_APP_API_BASE, ''), response)
      const obj = {
        prettyRequestHeader: error.config.headers,
        errorMessage: `${error.name}: ${error.message}`,
        logType: ["error", "network"],
      };
      let responseObject = {
        requestId,
        responseData: response,
      };

      response.logData = obj;
      callback(wrapResponse(responseObject));
    } else {
      const errorResponse = error.response;
      const info = {
        bodySize: errorResponse
          ? getBufLength(JSON.stringify(errorResponse.data), "utf8") / 1024
          : 0,
        headerSize: errorResponse
          ? getBufLength(JSON.stringify(errorResponse.headers), "utf8") / 1024
          : 0,
        time: end - start,
      };

      const contentType = errorResponse.headers["content-type"];

      if (contentType.indexOf("application/json") > -1) {
        errorResponse.data = JSON.parse(errorResponse.data);
      } else if (contentType.indexOf("text/html") > -1) {
        const decoder = new TextDecoder("utf-8");

        errorResponse.data = decoder.decode(errorResponse.data);
      }

      const response = {
        status: errorResponse ? errorResponse.status : error.errno,
        headers: errorResponse ? errorResponse.headers : undefined,
        data: errorResponse
          ? errorResponse.data
          : "Error: " + error.syscall + " " + error.code,
        info,
      };

      helper.logToFile("API Error", arg.url, response);
      // helper.logToFile('API Error', arg.url.replace(process.env.VUE_APP_API_BASE, ''), response)

      const obj = {
        prettyRequestBody: arg.body || undefined,
        prettyRequestHeader: arg.header,
        prettyRequest: arg,
        // rawRequestBody:tempBodyData,
        resHeader: response.headers,
        resBody: response.data,
        prettyResponse: {
          responseHeaders: response.headers,
          responseBody: response.data,
        },
        responseMeta: info,
        logType: ["error", "network"],
      };
      response.logData = obj;
      let responseObject = {
        requestId,
        responseData: response,
      };
      callback(wrapResponse(responseObject));
    }

    removeToken(requestId);
  }
};

const cancelHttpRequest = (requestId) => {
  removeToken(requestId);
};

const removeToken = (requestId) => {
  const tokenIndex = cancelTokens.findIndex((e) => e.requestId === requestId);
  if (tokenIndex !== -1) {
    cancelTokens[tokenIndex].request.cancel("Request canceled");
    cancelTokens.splice(tokenIndex, 1);
  }
};

export { httpRequest, apiRequest, cancelHttpRequest };

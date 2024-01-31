import { reactive, ref, watch } from 'vue'

const logData = reactive({
  logList:[],
  totalWarningCount: 0,
  totalErrorCount: 0
})

// const handleLogData = ({logObj, status, axiosObj2}) => {
//   console.log('handleLogData axiosObj2__', axiosObj2)

//   const now = new Date();

//   const hours = now.getHours();
//   const minutes = now.getMinutes();
//   const seconds = now.getSeconds();
//   const milliseconds = now.getMilliseconds();

//   const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

//   const obj = {
//     subObj: {
//       requestHeaders: logObj.prettyRequestHeader,
//       requestBody: logObj.prettyRequestBody,
//       responseHeaders: logObj.resHeader,
//       responseBody: logObj.resBody,
//     },
//     responseMeta:logObj.responseMeta,
//     method: logObj.prettyRequest.method,
//     url: logObj.prettyRequest.url,
//     id: Date.now(),
//     status:status,
//     logType: logObj.logType,
//     timestamps: formattedTime
//   }
//   logData.logList.push(obj)
//   calcCount(obj.logType)
//   // console.log('logData.logList__', logData.logList)
//   // console.log('logList__', logList)
// }

const handleLogData = ({status, axiosObj2}) => {
  if (!axiosObj2) return
  const now = new Date();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  const contentType = axiosObj2.prettyLog.responseHeader['content-type'];
  // console.log(contentType)
  // TODO: 如果 contentType 為 mediaType(可能為圖片可能為 html...等)，需顯示對應文字；其餘直接顯示原本內容

  let streamText = ''
  if (axiosObj2.rawLog.stream) {
    axiosObj2.rawLog.stream.forEach((a, index) => {
      if (a) {
        a = a.replace(/\r\n\r\n/g, '\n')
        a = a.replace(/\r\n/g, '\n')
      } else {
        a = '\n'
      }
      streamText += a
    })
  }

  if (contentType === "image/bmp") {
    axiosObj2.rawLog.responseBody = 'The console does not support viewing bodies with media files.'
  }



  const obj = {
    subObj: {
      requestHeaders: axiosObj2.prettyLog.requestHeader,
      requestBody: axiosObj2.originalBodyData,
      responseHeaders: axiosObj2.prettyLog.responseHeader,
      // responseBody: axiosObj2.prettyLog.responseBody,
      responseBody: contentType === "image/bmp" ? 'The console does not support viewing bodies with media files.' : axiosObj2.prettyLog.responseBody,

    },
    rawLog: axiosObj2.rawLog,
    responseMeta:axiosObj2.responseMeta,
    method: axiosObj2.method,
    url: axiosObj2.url,
    id: Date.now(),
    status:status,
    logType: axiosObj2.logType,
    timestamps: formattedTime,
    streamText,
    isShowRawLog: false
  }
  logData.logList.push(obj)
  calcCount(obj.logType)
  // console.log('logData.logList__', logData.logList)
  // console.log('logList__', logList)
}

const clearLogList = () => {
  logData.logList.value = []
}

const calcCount = (typeList) => {
  const isError = (type) => type === "error";
  const isWarn = (type) => type === "warn";

  if (typeList.some(isError)) return logData.totalErrorCount += 1;
  if (typeList.some(isWarn)) return logData.totalWarningCount += 1;
}

export default {
  handleLogData,
  logData,
  clearLogList
}

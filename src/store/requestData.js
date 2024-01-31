import { reactive, computed, watch } from 'vue'
import DataTypeEnum from '@/js/enum/dataTypeEnum'
import TypeEnum from '@/js/enum/typeEnum'
import tabsData from './tabs'
import store from '@/store'
import stripJsonComments from 'strip-json-comments'
import { ipcHttpRequest, ipcHttpCallback, omScriptEventStart, omScriptEventEnd } from '@/js/ipc/httpRequestIPC.js'
import workspaceData from '@/store/workspace'
import om from "@/js/utils//om.js";

const data = reactive({ // 須做轉換的資料
  paramsArr: [],
  paramStr: '',
  headerArr: [],
  formDataArr: [],
  urlEncodedArr: [],
  url: '',
  formatUrl: '',
  rawType: '',
  raw: ''
})

const requestData = reactive({ // 最終送出請求的資料
  method: '',
  url: '',
  header: {},
  body: undefined,
  dataType: ''
})

const response = reactive({
  responseData: {},
  loading: false
})

const setRequestData = (tabInfo) => {
  requestData.url = ''
  requestData.method = ''
  requestData.header = {}
  requestData.body = undefined
  requestData.dataType = ''


  if (tabInfo.tabType === TypeEnum.item.name) {

    const request = tabInfo.request
    // console.log('request__', request)
    // setting requestData-url
    requestData.url = tabsData.searchAndUseVariables(request.url.raw)
    
    // setting requestData-method
    requestData.method = request.method

    // setting requestData-dataType
    requestData.dataType = request.body.mode || 'none'

    // setting requestData-header
    prepareHttpHeader(request.header)

    // setting requestData-body

    /**
     * 原本request method為 'GET'或'DELETE'時，若body原本有內容時會將內容清掉，但會導致故意選擇錯誤的request method時，無法顯示對應的錯誤訊息:method not allowed，因此先註解
     */
    // if (requestData.method === 'GET' || requestData.method === 'DELETE') {
    //     clearBody()
    // }

    if (request.body && request.body.mode) {
      switch (request.body.mode) {
        case DataTypeEnum.APPLICATION_JSON.dataType:
          handleBody(request.body.raw)
          break
        case DataTypeEnum.MULTIPART_FORMDATA.dataType:
          handleFormData(request.body.formdata)
          break
        case DataTypeEnum.URLENCODED.dataType:
          handleUrlEncoded(request.body.urlencoded)
          break
        default:
          break
      }
    }
  }
}

const prepareHttpHeader = (headerArray) => {
  if (!headerArray) return

  requestData.header = {}

  const cloneArr = headerArray.filter(e => e.disabled !== true)
  cloneArr.forEach((h) => {
    requestData.header[h.key] = h.value
  })
}

// const clearBody = () => {
//   requestData.dataType = 'none'
//   requestData.body = ''
// }

const selectedEnvironmentId = computed(() => {
  return store.getters.getSelectedEnvironmentId
})

const handleBody = (raw) => {
  let rawString = tabsData.searchAndUseVariables(raw, selectedEnvironmentId.value)
  if (!rawString) {
    return
  }
  rawString = stripJsonComments(rawString) // 將註解過濾
  try {
    JSON.parse(rawString.replaceAll(/\r|\n/g, ''))
    requestData.body = JSON.parse(rawString.replaceAll(/\r|\n/g, ''))
  } catch (error) {
    // console.log('不符合 JSON 語法規範')
    // requestData.body = rawString.replaceAll(/\r|\n/g, '')
  }
}

const handleFormData = (formdataArray) => {
  requestData.body = {}
  const cloneArr = formdataArray.filter(e => !e.disabled)
  cloneArr.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.type === 'text' ? h.value : h.stringList, selectedEnvironmentId.value)
    requestData.body[convertedKey] = convertedValue
  })
}

const handleUrlEncoded = (urlEncodedArray) => {
  requestData.body = {}
  const cloneArr = urlEncodedArray.filter(e => !e.disabled)
  cloneArr.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.value, selectedEnvironmentId.value)
    requestData.body[convertedKey] = convertedValue
  })
}

const clear = () => {
  data.paramsArr = []
  data.paramStr = ''
  data.headerArr = []
  data.formDataArr = []
  data.urlEncodedArr = []
  data.url = ''
  data.formatUrl = ''
  data.rawType = ''
}

const preRequestScope = reactive({
  environment: {
    set: [],
    get: [],
    unset: []
  }
})

const tabsPane = computed(() => {
  return store.getters.getTabsPane;
});

// const currentTabData = computed(() => {
//   return store.getters.getCurrentTabData;
// });

// const responseData = computed(() => {
//   return store.getters.getResponseData
// })

const beforeSendRequest = async(currentTabInfo) => {
  // preRequestResponseInfo.preRequestResponse = {}
  const preRequestResult = tabsData.getFormattedScript(currentTabInfo, 'prerequest')
  async function updateVariableData(preRequestContent) {
    await workspaceData.updateVariableData(preRequestContent)
  }
  if (preRequestResult) {
    omScriptEventStart()
    // isDone 是用來判斷 pre-request 是否執行完畢
    const isDone = await om.handleScript(preRequestResult)

    if (isDone) {
      omScriptEventEnd()
      // 依據 pre-request 的內容，判斷是否要更新變數
      updateVariableData(preRequestResult).then(()=>{
        sendRequest(currentTabInfo)
      })
    }
  } else {
    // 沒 preRequestResult

    sendRequest(currentTabInfo)
  }
}

const sendRequest = async (currentTabInfo) => {
  // send request時，有可能在pre-request進行auth的設定或修正，需再檢查一次
  tabsData.checkAndUpdateAuthorization(currentTabInfo.request.auth, currentTabInfo)

  // send request時，有可能在pre-request進行 variable 的設定或修正，需再設定一次
  setRequestData(currentTabInfo)


  // reactive 物件可能包含一些帶有方法和/或其他不可cloned屬性, 導致報錯"An object could not be cloned", 所以須要做以下處理
  const submitData = JSON.parse(JSON.stringify(requestData))
  // console.log('submitData__', submitData)
  let obj = {
    id: currentTabInfo.id,
    submitData
  }

  ipcHttpRequest(obj)
  // ipcHttpRequest(submitData)
  // ipcHttpCallback()
}


const preRequestResponseInfo = reactive({
  preRequestResponse: {},
})

// 2023/11/29 以下為將共同資料拉到 globalData後，重寫的 func ↓

const prepareHttpHeader1 = (headerArray) => {
  if (!headerArray) return
  let obj = {}

  const cloneArr = headerArray.filter(e => e.disabled !== true)
  cloneArr.forEach((h) => {
    obj[h.key] = h.value
  })

  return obj
}

const handleBody1 = (raw) => {
  let rawString = tabsData.searchAndUseVariables(raw, selectedEnvironmentId.value)
  if (!rawString) {
    return
  }
  rawString = stripJsonComments(rawString) // 將註解過濾
  try {
    JSON.parse(rawString.replaceAll(/\r|\n/g, ''))
    return JSON.parse(rawString.replaceAll(/\r|\n/g, ''))
  } catch (error) {
    // console.log('不符合 JSON 語法規範')
    // requestData.body = rawString.replaceAll(/\r|\n/g, '')
  }
}

const handleFormData1 = (formdataArray) => {
  let obj = {}
  const cloneArr = formdataArray.filter(e => !e.disabled)
  cloneArr.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.type === 'text' ? h.value : h.stringList, selectedEnvironmentId.value)
    obj[convertedKey] = convertedValue
  })
  return obj
}

const handleUrlEncoded1 = (urlEncodedArray) => {
  let obj = {}
  const cloneArr = urlEncodedArray.filter(e => !e.disabled)
  cloneArr.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.value, selectedEnvironmentId.value)
    obj[convertedKey] = convertedValue
  })

  return obj
}

const sendRequest1 = async () => {
  // send request時，有可能在pre-request進行auth的設定或修正，需再檢查一次
  // tabsData.checkAndUpdateAuthorization(currentTabInfo.request.auth, currentTabInfo)

  // send request時，有可能在pre-request進行 variable 的設定或修正，需再設定一次
  // setRequestData(currentTabInfo)


  // reactive 物件可能包含一些帶有方法和/或其他不可cloned屬性, 導致報錯"An object could not be cloned", 所以須要做以下處理
  const requestArg = store.getters.getRequestData
  // console.log('requestArg__', requestArg)
  const submitData = JSON.parse(JSON.stringify(requestArg))
  // console.log('submitData__', submitData)

  ipcHttpRequest(submitData)
  // ipcHttpCallback()
}

const handleAndSetRequestData = (tabInfo) => {
  if (tabInfo.tabType === TypeEnum.item.name) {
    const { request } = tabInfo
    const arg = {
      method: '',
      url: '',
      header: {},
      body: undefined,
      dataType: ''
    }

    // setting requestData-url
    arg.url = tabsData.searchAndUseVariables(request.url.raw)

    // setting requestData-method
    arg.method = request.method

    // setting requestData-dataType
    arg.dataType = request.body.mode || 'none'

    // setting requestData-header
    arg.header = prepareHttpHeader1(request.header)

    /**
     * 原本request method為 'GET'或'DELETE'時，若body原本有內容時會將內容清掉，但會導致故意選擇錯誤的request method時，無法顯示對應的錯誤訊息:method not allowed，因此先註解
     */
    // if (requestData.method === 'GET' || requestData.method === 'DELETE') {
    //     clearBody()
    // }

    if (requestData.dataType === DataTypeEnum.APPLICATION_JSON.dataType) {
      arg.body = handleBody1(request.body.raw)
    } else if (requestData.dataType === DataTypeEnum.MULTIPART_FORMDATA.dataType) {
      arg.body = handleFormData1(request.body.formdata)
    } else if (requestData.dataType === DataTypeEnum.URLENCODED.dataType) {
      arg.body = handleUrlEncoded1(request.body.urlencoded)
    }

    // console.log('final arg__', arg)
    store.commit("SET_REQUEST_DATA", arg);
    sendRequest1()
  }
}


const obj = {
  data,
  requestData,
  response,
  handleFormData,
  handleUrlEncoded,
  handleBody,
  clear,
  prepareHttpHeader,
  preRequestScope,
  sendRequest,
  preRequestResponseInfo,
  beforeSendRequest,
  // 2023/11/29 分隔線----
  handleAndSetRequestData
}

export default obj

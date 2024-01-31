import workspaceData from '@/store/workspace'
import requestData from '@/store/requestData'
import tabsData from '@/store/tabs'
import { watch, computed, ref } from 'vue'
// import { omScriptEventStart, omScriptEventEnd } from '@/js/ipc/httpRequestIPC.js'
import DataTypeEnum from '@/js/enum/dataTypeEnum'
import store from '@/store'
import stripJsonComments from 'strip-json-comments'
// import axios from 'axios'
// import { httpRequest } from '@/js/utils/httpRequest.js'
import { ipcHttpRequest, ipcHttpCallback, omScriptEventStart, omScriptEventEnd } from '@/js/ipc/httpRequestIPC.js'
import cookieStore from '@/store/cookie.js'

const fs = require('fs')
const util = require('util');

class om {}

om.logger = console;

// om.logger.info('TEST')


const getGlobalVar = (globalsKey) => {
  return workspaceData.getGlobalVar(globalsKey)
}

const setGlobalVar = (globalKey, globalValue) => {
  console.log('???/')
  workspaceData.setGlobalVar(globalKey, globalValue)
}

const unsetGlobalVar = (globalKey) => {
  workspaceData.removeGlobalVar(globalKey)
}
om.globals = {
  get: getGlobalVar,
  set: setGlobalVar,
  unset: unsetGlobalVar
}

const getEnvironmentVar = (environmentKey) => {
  return workspaceData.getEnvironmentVar(environmentKey)
}

const setEnvironmentVar = (environmentKey, environmentValue) => {
  workspaceData.setEnvironmentVar(environmentKey, environmentValue)
}

const unsetEnvironmentVar = (environmentKey) => {
  workspaceData.removeEnvironmentVar(environmentKey)
}
om.environment = {
  get: getEnvironmentVar,
  set: setEnvironmentVar,
  unset: unsetEnvironmentVar
}

const getCollectionVar = (collectionKey) => {
  return workspaceData.getCollectionVar(collectionKey)
}

const setCollectionVar = (collectionKey, collectionValue) => {
  workspaceData.setCollectionVar(collectionKey, collectionValue)
}

const unsetCollectionVar = (collectionKey) => {
  workspaceData.removeCollectionVar(collectionKey)
}

om.collectionVariables = {
  get: getCollectionVar,
  set: setCollectionVar,
  unset: unsetCollectionVar
}

const getVariable = (variableKey) => {
  return workspaceData.getVariable(variableKey)
}

om.variables = {
  get: getVariable
}

om.isSendRequest = false

const sendRequest = async (payload, callback) => {
  return new Promise(async (resolve, reject) => {
    try {
      om.isSendRequest = false;
      const actualRequestData = setRequestData(payload);
      ipcHttpRequest(actualRequestData);

      const response = await ipcHttpCallback(true);

      requestData.preRequestResponseInfo.preRequestResponse = response;
      om.isSendRequest = true;
      // requestData.response.responseData = response // 讓 cookie store 可以監聽 response headers 是否有cookies 並做對應資料處理
      callback(null, response);
      resolve(true);
    } catch (error) {
      callback(error, null);
      reject(error);
    }
  });
}

om.sendRequest = sendRequest

const setRequestData = (payload) => {
  const obj = {}
  obj.header = payload.header
  if (Object.prototype.hasOwnProperty.call(payload, 'cookie')) {
    // console.log('有cookie')
  } else {
    // console.log('沒cookie')
    const result = handleAndSetCookie(payload.url)
    if (result) {
      obj.header = {...obj.header, 'cookie': result}
    }
  }

  handleAndSetCookie(payload.url)

  // setting requestData-method
  obj.method = payload.method

  // setting requestData-url
  obj.url = payload.url

  // setting requestData-dataType
  obj.dataType = payload.body.mode || 'none'

  if (JSON.stringify(payload.body) !== '{}') {
    if (payload.body.mode === DataTypeEnum.APPLICATION_JSON.dataType) {
      // console.log('處理 raw 資料')
      obj.body = handleBody(payload.body[DataTypeEnum.APPLICATION_JSON.dataType])
    } else if (payload.body.mode === DataTypeEnum.MULTIPART_FORMDATA.dataType) {
      // console.log('處理 formdata 資料')
      obj.body = handleFormData(payload.body[DataTypeEnum.MULTIPART_FORMDATA.dataType])
    } else if (payload.body.mode === DataTypeEnum.URLENCODED.dataType) {
      // console.log('處理 UrlEncoded 資料')
      obj.body = handleUrlEncoded(payload.body[DataTypeEnum.URLENCODED.dataType])
    }
  }
  return obj
}

const selectedEnvironmentId = computed(() => {
  return store.getters.getSelectedEnvironmentId
})

const handleBody = (raw) => {
  const str = JSON.stringify(raw)
  let rawString = tabsData.searchAndUseVariables(str, selectedEnvironmentId.value)
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

const handleFormData = (formdataArray) => {
  // const cloneArr = formdataArray.filter(e => !e.disabled)
  const obj = {}
  formdataArray.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.value, selectedEnvironmentId.value)
    obj[convertedKey] = convertedValue
  })
  return obj
}

const handleUrlEncoded = (formdataArray) => {
  // const cloneArr = formdataArray.filter(e => !e.disabled)
  const obj = {}
  formdataArray.forEach((h, index) => {
    const convertedKey = tabsData.searchAndUseVariables(h.key, selectedEnvironmentId.value)
    const convertedValue = tabsData.searchAndUseVariables(h.value, selectedEnvironmentId.value)
    obj[convertedKey] = convertedValue
  })
  return obj
}

// om.response = {}

const responseData = {}

const getResponseData = () => {
  if (JSON.stringify(responseData) !== '{}') {
    return responseData
  }
  return ''
}

om.response = {
  get: getResponseData
}

watch(() => requestData, async () => {

// watch(() => requestData.response.responseData, async () => {
  if (!requestData) return
  if (JSON.stringify(requestData.response.responseData) === '{}') {
    return
  }
  Object.assign(responseData, requestData.response.responseData)
  if (responseData.status) {
    let testScriptResult = ''
    const result = tabsData.tabInfo.tabsPane.find(e => e.tabKey === tabsData.tabInfo.currentTabId)
    // const result = tabsData.tabInfo.tabsPane.find(e => e.id === tabsData.tabInfo.currentTabId)
    if (result) {
      testScriptResult = tabsData.getFormattedTestsScript(result)
      if (testScriptResult) {
        omScriptEventStart()
        // eslint-disable-next-line no-eval
        await eval(testScriptResult)
        workspaceData.updateVariableData(testScriptResult)
        omScriptEventEnd()
      }
    }
  }
})

const cookiesDB = computed(() => {
  return store.getters.getCookieData
})


const handleAndSetCookie = (requestUrl) => {
  if (!requestUrl) return ''
  const matches = requestUrl.match(/http[s]?:\/\/([.\-a-z0-9]*)\/?/)
  if (!matches || matches.length < 2) { // 沒有找到匹配的
    return ''
  }

  const domain = matches[1]
  if (cookiesDB.value.length > 0) {
    const matchCookie = cookiesDB.value.find((e) => e.domain === domain)

    if (!matchCookie || matchCookie.cookies.length === 0) { // 找不到符合的domain
      // tabsData.clearCookie(currentTabInfo.value)
      return ''
    }

    const cookieString = cookieStore.findAndGenerateCookieString(matchCookie)

    return cookieString

  }
  return ''

}
export default om

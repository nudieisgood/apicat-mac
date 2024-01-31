import { reactive, computed, watch } from 'vue'
import workspaceData from '@/store/workspace'
import { getRawTypeFromDataType } from '@/js/enum/dataTypeEnum'
import AuthTypeEnum from '@/js/enum/authTypeEnum'
import TypeEnum from '@/js/enum/typeEnum.js'
import store from '@/store'
import Helper from '@/js/utils/helper'
import requestData from '@/store/requestData'
import { editCollection } from '@/js/ipc/collectionIPC.js'
import { editItem } from '@/js/ipc/itemIPC.js'
import { editFolder } from '@/js/ipc/folderIPC.js'
import { editEnvironment } from '@/js/ipc/environmentIPC.js'
import { defaultHeaders } from "@/js/config/header";
import DataTypeEnum from '@/js/enum/dataTypeEnum'
import MethodTypeEnum from "@/js/enum/methodTypeEnum.js";

// tab資料
const tabInfo = reactive({
  isUpdateCookies: false,
  originalTab: {},
  comparedTab:{}
  /**
   * 若該response body含有非 ASCII 字元(比如檔案類型)，執行API時因無法正確解析而會出現問題。
   * 儲存example時會發生上述情況，所以先存一份原始的內容，執行存example的API時將非 ASCII 字元過濾掉
   */
  // originalResponseBody: ''

  /**
  * tabPanel內的資料格式
  * {
  *  id: activeKey.value,
  *  name: 'Untitled Request',
  *  description: null,
  *  event: null,
  *  tabType: collection //collection, folder, item, environment, globals, collection
  *  request: {
  *    url: null,
  *    auth: null,
  *    proxy: null,
  *    certificate: null,
  *    method: 'GET',
  *    description: null,
  *    header: [{key:'content-type', value: 'application/json', description: 'N/A', disabled: false}],
  *    body: {
  *      mode: 'raw', //raw, multipart-form-data, xxx-form-urlencoded
  *      raw: {id: 1},
  *      formdata: [{key: 'name', value: 'John', description: '值日生'}]
  *    }
  *  },
  *  response: null
  * }
  */
})

// window.currentTabInfo = currentTabInfo

const clearContentType = (currentTabInfo) => {
  if (!currentTabInfo.request.header || !Array.isArray(currentTabInfo.request.header)) {
    currentTabInfo.request.header = []
  }

  const removeItems = currentTabInfo.request.header.filter(e => e.key.match(/content-type/i))

  removeItems.forEach(item => {
    const index = currentTabInfo.request.header.findIndex(e => e === item)
    if (index > -1) {
      currentTabInfo.request.header.splice(index, 1)
    }
  })
}

const setContentType = (contentType, currentTabInfo) => {
  clearContentType(currentTabInfo)

  if (currentTabInfo.request.header && Array.isArray(currentTabInfo.request.header)) {
    const obj = { key: 'content-type', value: contentType, description: '', disabled: false }
    currentTabInfo.request.header.push(obj)
  }

  // initElementId(currentTabInfo.request.header)
  initElementId1(currentTabInfo.request.header, 'item')
}

const setContentTypeAndLength = (currentTabInfo) => {
  const { request } = currentTabInfo
  const { method, body} = request
  const type = getRawTypeFromDataType(body.mode)
  const rawType = type.rawType

  let contentTypeObject = {
    key: 'content-type',
    value: rawType,
    description: '',
    disabled: false,
    isSystem: true
  }
  const contentLengthText = () => {
    if ((method === MethodTypeEnum.POST.label || method === MethodTypeEnum.PATCH.label) && body.mode === DataTypeEnum.NONE.dataType) {
      return '0'
    }
    return '<calculated when request is sent>'
  }
  let contentLengthObject = {
    key: 'Content-Length',
    value: contentLengthText(),
    description: '',
    disabled: false,
    isSystem: true
  }

  const contentLengthResultIndex = currentTabInfo.request.header.findIndex((e)=>e.key === 'Content-Length')
  if (contentLengthResultIndex > -1) {
    currentTabInfo.request.header[contentLengthResultIndex] = {...contentLengthObject}
  } else {
    currentTabInfo.request.header.push(contentLengthObject)
  }
  const contentTypeResultIndex = currentTabInfo.request.header.findIndex((e)=>e.key === 'content-type' || e.key === 'Content-Type')
  if (contentTypeResultIndex > -1) {
    currentTabInfo.request.header[contentTypeResultIndex].isSystem = true
  } else {
    currentTabInfo.request.header.push(contentTypeObject)
  }

  switch (method) {
    case MethodTypeEnum.GET.label:
    case MethodTypeEnum.DELETE.label:

    switch (body.mode) {
      case DataTypeEnum.NONE.dataType:
        currentTabInfo.request.header = currentTabInfo.request.header.filter(header => {
          return header.key !== 'Content-Length' && header.key !== 'content-type';
        });
        break;
    }

    case MethodTypeEnum.POST.label:
    case MethodTypeEnum.PATCH.label:
      switch (body.mode) {
        case DataTypeEnum.NONE.dataType:
          currentTabInfo.request.header = currentTabInfo.request.header.filter(header => {
            return header.key !== 'content-type';
          });
          break;
      }
  }
}

// 預設 header 資料
const setDefaultHeader = (request) => {
  let defaultHeaderSource = Object.entries(defaultHeaders).map(
    ([key, value]) => ({
      key: `${key}`,
      value,
      description: '',
      disabled: false,
      isSystem: true
    })
  );

  if (!request.header) {
    return defaultHeaderSource
  }
  const uniqueRequestHeader = request.header.filter(header => {
    const matchDefaultHeader = defaultHeaderSource.find(defaultHeader => defaultHeader.key === header.key);
    return !matchDefaultHeader; // 取出 defaultHeaderSource 不含 request.header 的項目
  });
  const mergedHeaders = [...uniqueRequestHeader, ...defaultHeaderSource];

  return mergedHeaders;
};

/**
 * @currentAuthType 當前認證類型
 */

const clearAuthorization = (currentTabInfo, currentAuthType) => {
  if (currentTabInfo.tabType === TypeEnum.collection.name || currentTabInfo.tabType === TypeEnum.folder.name) {
    if (currentAuthType === AuthTypeEnum.BEARER) { // 若為bearer但token沒有值時，不直接將authType設為noauth，而是將bearer初始化為[]
      currentTabInfo.auth[AuthTypeEnum.BEARER] = []
    } else {
      currentTabInfo.auth = {
        type: AuthTypeEnum.NOAUTH,
        [AuthTypeEnum.BEARER]: [] // 雖然 type 為 noauth，但開啟tab時初始化時有這個屬性，若沒這個屬性會影響tab編輯前/後的比較 (是否顯示橘點)
      }
    }
  } else if (currentTabInfo.tabType === TypeEnum.item.name) {
    if (currentAuthType === AuthTypeEnum.BEARER) {
      currentTabInfo.request.auth[AuthTypeEnum.BEARER] = []
    } else {
      currentTabInfo.request.auth = {
        type: AuthTypeEnum.NOAUTH
      }
    }
    if (currentTabInfo.request?.header && Array.isArray(currentTabInfo.request.header)) {
      const removeItems = currentTabInfo.request?.header.filter(e => e.key.match(/authorization/i))

      removeItems.forEach(item => {
        const index = currentTabInfo.request.header.findIndex(e => e === item)
        if (index > -1) {
          currentTabInfo.request.header.splice(index, 1)
        }
      })
    }
  }
}

/**
 * @authType 認證類型,
 * @token 認證token
 */
const setAuthorization = (type, token, currentTabInfo) => {
  clearAuthorization(currentTabInfo)

  if (type === AuthTypeEnum.BEARER) {
    // const bearerToken = `Bearer ${token}`
    let bearerToken = ''
    if (token.includes('Bearer')) {
      bearerToken = token
    } else {
      bearerToken = `Bearer ${token}`
    }

    if (currentTabInfo.tabType === TypeEnum.collection.name || currentTabInfo.tabType === TypeEnum.folder.name) {
      currentTabInfo.auth = {
        type: 'bearer',
        bearer: [
          { key: 'token', value: token, type: 'string' }
        ]
      }
    } else if (currentTabInfo.tabType === TypeEnum.item.name) {
      currentTabInfo.request.auth = {
        type: 'bearer',
        bearer: [
          { key: 'token', value: token, type: 'string' }
        ]
      }

      currentTabInfo.request.header.push({
        key: 'authorization', value: searchAndUseVariables(bearerToken), disabled: false, selected: true
      })
      initHeaderData(currentTabInfo.request.header)
    }
  }
}

const selectedEnvironmentId = computed(() => {
  return store.getters.getSelectedEnvironmentId
})

const environmentList = computed(() => {
  return store.getters.getEnvironmentList
})

const currentWorkspace = computed(() => {
  return store.getters.getCurrentWorkspace
})

const items = computed(() => {
  return store.getters.getCurrentWorkspaceItems
})

const variablesState = computed(() => {
  return store.getters.getVariablesState;
});

const replaceVariables = (text, variables) => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const variable = variables.find(el => el.key === key);
    if (variable && !variable.disabled) {
      // return variable.value;
      let replacedValue = variable.value;
      // 遞迴調用 replaceVariables 處理 replacedValue 中有符合{{xx}}的部分
      replacedValue = replaceVariables(replacedValue, variables);
      return replacedValue;
    }
    return match; // If variable not found or disabled, keep the original placeholder
  });
};

const searchAndUseVariables = (rawString) => {
  let text = rawString

  // const currentEnvironment = environmentList.value.find(e => e.id === selectedEnvironmentId.value)
  // if (currentEnvironment) {
  //   console.log('currentEnvironment.variable__', JSON.parse(JSON.stringify(currentEnvironment.variable)))
  //   // currentEnvironment.variable.forEach((el) => {

  //   //   if (text.indexOf(`{{${el.key}}}`) > -1) {
  //   //     if (!el.disabled) {
  //   //       text = text.replace(`{{${el.key}}}`, el.value)
  //   //     }
  //   //   }
  //   // })
  //   text = replaceVariables(text, variablesState.value.environmentVariable);
  //   // text = replaceVariables(text, currentEnvironment.variable);
  // }


  if (variablesState.value.environmentVariable?.length > 0) {
    const newText = replaceVariables(text, variablesState.value.environmentVariable);
    if (newText !== text) { // 表示有找到對應的變數並取代成功
      text = newText;
    }
  }

  // text === rawString 表示在環境變數裡找不到對應的變數做替換，由 collection variable 去找
  if (text === rawString && variablesState.value.collectionVariable?.length > 0) {
    const newText = replaceVariables(text, variablesState.value.collectionVariable);
    if (newText !== text) { // 表示有找到對應的變數並取代成功
      text = newText;
    }
  }

  // text === rawString 表示在collection 變數裡找不到對應的變數做替換，由 global variable 去找
  if (text === rawString && currentWorkspace.value.variable?.length > 0) {
    const newText = replaceVariables(text, currentWorkspace.value.variable);
    if (newText !== text) { // 表示有找到對應的變數並取代成功
      text = newText;
    }
  }

  return text || rawString
}

const setPrerequest = (script, eventType, currentTabInfo) => {
  let tempScript;
  if (!script) {
    tempScript = [] // 若沒此判斷，script.split('\n')結果為 [""]，會影響編輯狀態判斷(顯示橘點)
  } else {
    tempScript = script.split('\n')
  }

  if (eventType === 'prerequest') {
    if (!currentTabInfo.event) {
      currentTabInfo.event = reactive([
        {
          listen: 'prerequest',
          script: {
            exec: [],
            type: 'text/javascript'
          }
        }
      ])
    }
    const findPreRequest = currentTabInfo.event.find(e => e.listen === 'prerequest')
    if (findPreRequest) {
      findPreRequest.script.exec = tempScript
    }
  }
}

const getFormattedPrerequest = (currentTabInfo) => {
  let text = ''
  if (!currentTabInfo.event) {
    return
  }
  const findPreRequest = currentTabInfo.event.find(e => e.listen === 'prerequest')

  if (findPreRequest) {
    const tempArr = JSON.parse(JSON.stringify(findPreRequest.script.exec))
    tempArr.forEach((el, index) => {
      if (index !== tempArr.length - 1) {
        text += `${el}\n`
      } else {
        text += el
      }
    })
  }
  text = searchAndUseVariables(text)
  return text
}

const getFormattedTestsScript = (currentTabInfo) => {
  let text = ''
  if (!currentTabInfo.event) {
    return
  }
  const findTestsScript = currentTabInfo.event.find(e => e.listen === 'test')
  if (findTestsScript) {
    const tempArr = JSON.parse(JSON.stringify(findTestsScript.script.exec))
    tempArr.forEach((el, index) => {
      if (index !== tempArr.length - 1) {
        text += `${el}\n`
      } else {
        text += el
      }
    })
  }
  text = searchAndUseVariables(text)
  return text
}

const setTestsScript = (script, eventType, currentTabInfo) => {
  let tempScript;
  if (!script) {
    tempScript = [] // 若沒此判斷，script.split('\n')結果為 [""]，會影響編輯狀態判斷(顯示橘點)
  } else {
    tempScript = script.split('\n')
  }

  if (eventType === 'test') {
    if (!currentTabInfo.event) {
      currentTabInfo.event = reactive([
        {
          listen: 'test',
          script: {
            exec: [],
            type: 'text/javascript'
          }
        }
      ])
    }
    const findTestsScript = currentTabInfo.event.find(e => e.listen === 'test')
    if (findTestsScript) {
      findTestsScript.script.exec = tempScript
    }
  }
}

const setScript = (script, eventType, currentTabInfo) => {
  let tempScript;
  if (!script) {
    tempScript = [] // 若沒此判斷，script.split('\n')結果為 [""]，會影響編輯狀態判斷(顯示橘點)
  } else {
    tempScript = script.split('\n')
  }


  if (!currentTabInfo.event) {
    currentTabInfo.event = reactive([
      {
        listen: eventType,
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
    ])
  }
  const findScript = currentTabInfo.event.find(e => e.listen === eventType)
  if (findScript) {
    findScript.script.exec = tempScript
  }
}

const getFormattedScript = (currentTabInfo, eventType) => {
  let text = ''
  if (!currentTabInfo.event) {
    return
  }
  const findScript = currentTabInfo.event.find(e => e.listen === eventType)
  if (findScript) {
    const tempArr = JSON.parse(JSON.stringify(findScript.script.exec))
    tempArr.forEach((el, index) => {
      if (index !== tempArr.length - 1) {
        text += `${el}\n`
      } else {
        text += el
      }
    })
  }
  text = searchAndUseVariables(text)
  return text
}

const preRequestScope = reactive({
  environment: {
    set: [],
    get: [],
    unset: []
  }
})

const initHeaderData = (headerArr) => {
  if (!headerArr) return

  // headerArr.forEach(headerArrRow => {
  //   const id = Helper.generateHashKey(5)
  //   headerArrRow.id = id
  // })

  initElementId1(headerArr, 'header')
}

const updateAuthorization = (type, currentTabInfo) => {
  if (type === AuthTypeEnum.INHERIT) {
    if (currentTabInfo.tabType === TypeEnum.collection.name || currentTabInfo.tabType === TypeEnum.folder.name) {
      currentTabInfo.auth = {
        type: AuthTypeEnum.INHERIT,
        bearer: null
      }
    } else if (currentTabInfo.tabType === TypeEnum.item.name) {
      currentTabInfo.request.auth = {
        type: AuthTypeEnum.INHERIT,
        bearer: null
      }
    }
  }
}

/**
 * 依據tabType進行資料初始化
 */

const initCollectionData = (data) => {
  if (!data.auth) {
    data.auth = {}
    data.auth.type = AuthTypeEnum.NOAUTH
    data.auth.bearer = []
  }
  if (!data.description) {
    data.description = ''
  }

  if (!data.event) {
    data.event = [
      {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      },
      {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
    ]
  } else {
    const findPreRequest = data.event.find(e => e.listen === 'prerequest')
    const findTestsScript = data.event.find(e => e.listen === 'test')

    if (!findPreRequest) {
      const preRequestObj = {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(preRequestObj)
    }

    if (!findTestsScript) {
      const testScriptObj = {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(testScriptObj)
    }
  }

  if (!data.variable) {
    data.variable = []
  } else {
    // initElementId(data.variable)
    initElementId1(data.variable, 'collection')
  }

  return data
}

const initFolderData = (data) => {
  if (!data.auth) {
    data.auth = {}
    data.auth.type = AuthTypeEnum.NOAUTH
    data.auth.bearer = []
  }
  if (!data.description) {
    data.description = ''
  }

  if (!data.event) {
    data.event = [
      {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      },
      {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
    ]
  } else {
    const findPreRequest = data.event.find(e => e.listen === 'prerequest')
    const findTestsScript = data.event.find(e => e.listen === 'test')

    if (!findPreRequest) {
      const preRequestObj = {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(preRequestObj)
    }

    if (!findTestsScript) {
      const testScriptObj = {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(testScriptObj)
    }
  }
  if (!data.item) {
    data.item = []
  }
  return data
}

const initItemData = (data) => {
  if (!data.request.auth) {
    data.request.auth = {}
    // data.request.auth.type = AuthTypeEnum.NOAUTH
    // data.request.auth.bearer = []
  }

  if (!data.request.auth.type) {
    data.request.auth.type = AuthTypeEnum.NOAUTH
  }

  if (!data.request.auth.bearer) {
    data.request.auth.bearer = []
  }

  if (!data.request.description) {
    data.request.description = ''
  }

  if (!data.request.body) {
    data.request.body = {}
    // data.request.body.formdata = []
    // data.request.body.mode = 'none'
    // data.request.body.raw = ''
    // data.request.body.urlencoded = []
  }
  if (!data.request.body.formdata) {
    data.request.body.formdata = []
  } else {
    // initElementId(data.request.body.formdata)
    initElementId1(data.request.body.formdata, 'formdata')
  }

  if (!data.request.body.mode) {
    data.request.body.mode = 'none'
  }

  if (!data.request.body.raw) {
    data.request.body.raw = ''
  }
  if (!data.request.body.urlencoded) {
    data.request.body.urlencoded = []
  }

  data.request.header = setDefaultHeader(data.request)
  setContentTypeAndLength(data)
  initElementId1(data.request.header, 'header')

  if (!data.request.url) {
    data.request.url = {}
    // data.request.url.query = []
    // data.request.url.raw = ''
  }

  if (!data.request.url.query) {
    data.request.url.query = []
  } else {
    // initElementId(data.request.url.query)
    initElementId1(data.request.url.query, 'params')
  }

  if (!data.request.url.raw) {
    data.request.url.raw = ''
  }

  if (!data.event) {
    data.event = [
      {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      },
      {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
    ]
  } else {
    const findPreRequest = data.event.find(e => e.listen === 'prerequest')
    const findTestsScript = data.event.find(e => e.listen === 'test')

    if (!findPreRequest) {
      const preRequestObj = {
        listen: 'prerequest',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(preRequestObj)
    }

    if (!findTestsScript) {
      const testScriptObj = {
        listen: 'test',
        script: {
          exec: [],
          type: 'text/javascript'
        }
      }
      data.event.push(testScriptObj)
    }
  }
  if (!data.response) {
    data.response = []
  }
  data.tempResponse = null // 暫存 response
  return data
}

const initWorkspaceData = (data) => {
  if (!data.variable) {
    data.variable = []
  } else {
    // initElementId(data.variable)
    initElementId1(data.variable, 'global')
  }
  return data
}

const initEnvironmentData = (data) => {
  if (!data.variable) {
    data.variable = []
  } else {
    initElementId1(data.variable, 'environment')
    // initElementId(data.variable)
  }
  data.tabKey = data.id
  return data
}

const initResponseExampleData = (data) => {
  if (!data.body) {
    data.body = {}
  }

  if (!data.header) {
    data.header = []
  } else {
    // initElementId(data.header)
    initElementId1(data.header, 'example-header')
  }

  if (!data.originalRequest) {
    data.originalRequest = {}
  }

  if (!data.originalRequest.body) {
    data.originalRequest.body = {}
  }

  if (!data.originalRequest.body.formdata) {
    data.originalRequest.body.formdata = []
  } else {
    // initElementId(data.originalRequest.body.formdata)
    initElementId1(data.originalRequest.body.formdata, 'example-formdata')
  }

  if (!data.originalRequest.body.mode) {
    data.originalRequest.body.mode = 'none'
  }

  if (!data.originalRequest.body.raw) {
    data.originalRequest.body.raw = ''
  }

  if (!data.originalRequest.url) {
    data.originalRequest.url = {}
  }

  if (!data.originalRequest.url.query) {
    data.originalRequest.url.query = []
  } else {
    // initElementId(data.originalRequest.url.query)
    initElementId1(data.originalRequest.url.query, 'example-params')
  }

  if (!data.originalRequest.url.raw) {
    data.originalRequest.url.raw = ''
  }

  if (!data.originalRequest.header) {
    data.originalRequest.header = []
  } else {
    // initElementId(data.originalRequest.header)
    initElementId1(data.originalRequest.header, 'example-header')
  }

  return data
}

const checkTypeToInitAndUseData = (data) => {
  let result
  if (data.tabType === TypeEnum.collection.name) {
    result = initCollectionData(data)
  } else if (data.tabType === TypeEnum.folder.name) {
    result = initFolderData(data)
  } else if (data.tabType === TypeEnum.item.name) {
    result = initItemData(data)
  } else if (data.tabType === TypeEnum.globals.name) {
    result = initWorkspaceData(data)
  } else if (data.tabType === TypeEnum.environment.name) {
    result = initEnvironmentData(data)
  } else if (data.tabType === TypeEnum.example.name) {
    result = initResponseExampleData(data)
  } else {
    result = data
  }
  result.isEditing = false // 是否編輯中
  result.isPin = false // 是否置頂
  result.responseBoxWidth = null // 紀錄縮放 response 區塊的寬度(左右排版)
  result.responseBoxHeight = null // 紀錄縮放 response 區塊的高度(上下排版)
  result.isSendingRequest = false // 是否執行發送請求
  return result
}

// --- start
// NOTE: 測試表格資料的id或key改用index ↓
const initElementId1 = (arr, type) => {
  if (arr.length > 0) {
    arr.forEach((row, index) => {
      row.id = `${type}-${index}`
    })
  }
  return arr
}
// --- end
const initElementId = (arr) => {
  if (arr.length > 0) {
    arr.forEach((row) => {
      const id = Helper.generateHashKey(5)

      row.id = id
    })
  }
  return arr
}

// URL Parameter 處理
const urlWatcher = {}

// 依據當前url重置query-data
const extractUrlParamsAndResetQuery = (tabInfo, url) => {
  // const iter = url.matchAll(/([^\\?]*)\.*$/g)
  let request = {}
  if (tabInfo.tabType === TypeEnum.item.name) {
    request = tabInfo.request
  } else if (tabInfo.tabType === TypeEnum.example.name) {
    request = tabInfo.originalRequest
  }

  const iter = url.match(/\?(.*$)/)
  if (!iter) {
    request.url.query = []
    return
  }
  const queryStr = iter[1]
  let queryStrResult = queryStr.match(/[^\\&]*/g)
  queryStrResult = queryStrResult.filter(el => el)
  const pairArr = []
  queryStrResult.forEach((str) => {
    let matchResult = str.indexOf('=') > -1 ? str.match(/([^\\=]*)/g) : [str]
    matchResult = matchResult.filter(el => el)
    const paramRow = reactive({
      id: Helper.generateHashKey(5),
      key: matchResult[0],
      value: matchResult[1] ? matchResult[1] : '',
      disabled: false
    })
    pairArr.push(paramRow)
  })

  request.url.query = pairArr
}

const refreshUrl = (request) => {
  const paramsStr = request.url.query.filter(e => !e.disabled).map(e => `${e.key}=${e.value}`).join('&')
  const baseUrl = request.url.raw.match(/(^https?:\/\/[^?]*)/) ? request.url.raw.match(/(^https?:\/\/[^?]*)/)[1] : request.url.raw.match(/([^?]*)/)[1]

  request.url.raw = baseUrl + '?' + paramsStr
}

const inheritedScope = reactive({
  inheritedInfo: {}
})

const getParentData = (targetParentId) => {
  const getMatchParent = (item, parentId) => {
    for (let i = 0; i < item.length; i++) {
      if (item[i].id === parentId) {
        if (item[i].auth) {
          if (item[i].auth.type === AuthTypeEnum.INHERIT) {
            return getMatchParent(items.value, item[i].parentId)
          }
          if (item[i].auth.type === AuthTypeEnum.BEARER) {
            return item[i]
          }
        }
        return item[i]
      }
      if (item[i].item && item[i].item.length > 0) {
        const result = getMatchParent(item[i].item, parentId)
        if (result) {
          return result
        }
      }
    }
    return undefined
  }
  const result = getMatchParent(items.value, targetParentId)
  inheritedScope.inheritedInfo = result
}

const useAndSetParentAuth = (currentTabInfo) => {
  if (!inheritedScope.inheritedInfo || !inheritedScope.inheritedInfo.auth) {
    return
  }

  if (inheritedScope.inheritedInfo.auth.type === AuthTypeEnum.BEARER) {
    let bearerToken = ''
    if (inheritedScope.inheritedInfo.auth[AuthTypeEnum.BEARER].length === 0) {
      return
    }
    const token = inheritedScope.inheritedInfo.auth[AuthTypeEnum.BEARER][0].value
    if (token.includes('Bearer')) {
      bearerToken = token
    } else {
      bearerToken = `Bearer ${token}`
    }
    if (currentTabInfo.tabType === TypeEnum.item.name) {
      const authItem = currentTabInfo.request.header.find(e => e.key === 'authorization')
      if (authItem) {
        authItem.value = searchAndUseVariables(bearerToken)
      } else {
        currentTabInfo.request.header.push({
          key: 'authorization', value: searchAndUseVariables(bearerToken), disabled: false
        })
        initHeaderData(currentTabInfo.request.header)
      }
    }
    // setAuthorization(AuthTypeEnum.BEARER, token, currentTabInfo)
    // setAuthorization(AuthTypeEnum.BEARER, tabsData.searchAndUseVariables(token))
  } else if (inheritedScope.inheritedInfo.auth.type === AuthTypeEnum.INHERIT) {
    getParentData(inheritedScope.inheritedInfo.parentId)
  } else if (inheritedScope.inheritedInfo.auth.type === AuthTypeEnum.NOAUTH) {
    clearAuthorization(currentTabInfo)
  }
}

const updateInheritedScope = (newData) => {
  inheritedScope.inheritedInfo = newData
}

const updateAndUseInheritedAuth = (currentTabInfo) => {
  if (currentTabInfo.tabType === TypeEnum.collection.name || currentTabInfo.tabType === TypeEnum.folder.name || currentTabInfo.tabType === TypeEnum.item.name) {
    let authType = currentTabInfo.auth?.type || currentTabInfo.request.auth?.type

    if (authType === AuthTypeEnum.INHERIT) {
      getParentData(currentTabInfo.parentId)
      useAndSetParentAuth(currentTabInfo)
    }
  }
  // if (currentTabInfo.tabType === TypeEnum.collection.name || currentTabInfo.tabType === TypeEnum.folder.name) {
  //   if (currentTabInfo.auth?.type === AuthTypeEnum.INHERIT) {
  //     getParentData(currentTabInfo.parentId)
  //     useAndSetParentAuth(currentTabInfo)
  //   }
  // } else if (currentTabInfo.tabType === TypeEnum.item.name) {
  //   if (currentTabInfo.request.auth?.type === AuthTypeEnum.INHERIT) {
  //     getParentData(currentTabInfo.parentId)
  //     useAndSetParentAuth(currentTabInfo)
  //   }
  // }
}

// 切換tab時候, 重新載入param pair
const initUrlParamsAndPatchByParamKey = (query) => {
  if (!query) return
  query.forEach(pair => {
    // 依據key找尋是否存在原本的param
    const watcherId = Helper.generateHashKey(5)
    const paramRow = reactive(pair)

    pair.id = watcherId

    urlWatcher[watcherId] = watch(paramRow, () => {
      refreshUrl()
    })

    // data.paramsArr.push(paramRow)
  })
}

/**
 * 觸發時機為：send request時，有可能在pre-request進行auth的設定或修正，並將新auth更新至requestData
 */
const checkAndUpdateAuthorization = (auth, currentTabInfo) => {
  if (auth.type === AuthTypeEnum.BEARER) {
    if (!auth[AuthTypeEnum.BEARER] || auth[AuthTypeEnum.BEARER].length === 0) {
      return
    }
    const rawString = auth[AuthTypeEnum.BEARER][0].value
    // rawString = tabsData.searchAndUseVariables(rawString, selectedEnvironmentId.value)

    setAuthorization(AuthTypeEnum.BEARER, rawString, currentTabInfo)
    requestData.prepareHttpHeader(currentTabInfo.request.header)
  }
}

const clearCookie = (currentTabInfo) => {
  if (!currentTabInfo) {
    return
  }
  if (currentTabInfo.tabType === TypeEnum.item.name) {
    if (!currentTabInfo.request.header) {
      return
    }
    const index = currentTabInfo.request.header.findIndex(e => e.key === 'cookie')
    if (index > -1) {
      currentTabInfo.request.header.splice(index, 1)
    }
  }
}

const setCookie = (cookieString, currentTabInfo) => {
  if (currentTabInfo.request.header) {
    const removeItems = currentTabInfo.request.header.filter(e => e.key.match(/cookie/i))

    removeItems.forEach(item => {
      const index = currentTabInfo.request.header.findIndex(e => e === item)
      if (index > -1) {
        currentTabInfo.request.header.splice(index, 1)
      }
    })

    const obj = { key: 'cookie', value: cookieString, disabled: false, description: ''}
    // const obj = { key: 'cookie', value: cookieString, description: '', disabled: false, id: Helper.generateHashKey(5) }

    currentTabInfo.request.header.push(obj)

    initElementId1(currentTabInfo.request.header, 'header')
    tabInfo.isUpdateCookies = true
  }
}
// 修改 sidebar 項目名稱
const editSidebarItemName = async (pane) => {
  let res = {}
  const id = pane.id
  const name = pane.name
  if (pane.tabType === TypeEnum.collection.name) {
    const obj = {
      collectionsId: id,
      collectionsName: name,
      workspaceId: currentWorkspace.value.id
    }
    res = await editCollection(obj)
  } else if (pane.tabType === TypeEnum.folder.name) {
    const obj = {
      folderId: id,
      folderName: name,
      workspaceId: currentWorkspace.value.id
    }
    res = await editFolder(obj)
  } else if (pane.tabType === TypeEnum.item.name) {
    const obj = {
      itemsId: id,
      itemsName: name,
      workspaceId: currentWorkspace.value.id
    }
    res = await editItem(obj)
  } else if (pane.tabType === TypeEnum.environment.name) {
    const obj = {
      environmentId: id,
      environmentName: name,
      workspaceId: currentWorkspace.value.id
    }
    res = await editEnvironment(obj)
  }
  return res
}

const setResponseExampleData = (currentTabInfo) => {
  const obj = {}
  obj.name = currentTabInfo.name
  obj.id = Date.now()
  obj.originalRequest = {}
  obj.originalRequest.method = currentTabInfo.request.method
  obj.originalRequest.header = []
  // obj.originalRequest.header = currentTabInfo.request.header
  obj.originalRequest.body = currentTabInfo.request.body
  obj.originalRequest.url = currentTabInfo.request.url
  obj.status = handleStatusText(currentTabInfo)
  obj.code = currentTabInfo.tempResponse.status
  obj.header = handleResponseData(currentTabInfo.tempResponse.data.headers)
  obj.cookie = []
  // obj.body = currentTabInfo.tempResponse.data.data

  const hasUnicodeNull = /\\u0000/.test(JSON.stringify(currentTabInfo.tempResponse.data.data))
  if (hasUnicodeNull) {
    const newContent = JSON.stringify(currentTabInfo.tempResponse.data.data).replace(/\\u0000/g, '\\u0003')
    obj.body = JSON.parse(newContent)
  } else {
    obj.body = JSON.stringify(currentTabInfo.tempResponse.data.data)
  }
  // // obj.body = JSON.stringify(currentTabInfo.tempResponse.data.data)

  return obj
}

const handleStatusText = (currentTabInfo) => {
  if (currentTabInfo.tempResponse.status === 200) {
    return 'OK'
  } else if (currentTabInfo.tempResponse.status === 404) {
    return 'Not Found'
  } else if (currentTabInfo.tempResponse.status === 400) {
    return 'Bad Request'
  } else if (currentTabInfo.tempResponse.errno) {
    return currentTabInfo.tempResponse.data.message
  }
}

const handleResponseData = (data) => {
  if (!data) return
  const formattedData = []
  const result = Object.keys(data).map((key) => [(key), data[key]])

  const tempArr = []
  result.forEach((e, index) => {
    const obj = {}
    obj.key = e[0]
    obj.value = e[1]
    tempArr.push(obj)
  })

  tempArr.forEach((el) => {
    if (el.key === 'set-cookie') {
      el.value = el.value.toString()
    }
    if (!(el.key === 'bodySize' || el.key === 'headerSize' || el.key === 'time')) { formattedData.push(el) }
  })

  return formattedData
}

const getCurrentItemData = (list, targetId) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      return list[i]
    }

    if (list[i].item && list[i].item.length > 0) {
      const result = getCurrentItemData(list[i].item, targetId)
      if (result) {
        return result
      }
    }
  }
  return undefined
}

const classifyMethodColor = (method) => {
  switch (method) {
    case 'GET':
      return 'request-get'
    case 'POST':
      return 'request-post'
    case 'DELETE':
      return 'request-delete'
    case 'PATCH':
      return 'request-patch'
    default:
      return '#000'
  }
}

const getAllParentKey = (treeData, currentId) => {
  const temp = []
  const getMatchParent = (item, key) => {
    for (let i = 0; i < item.length; i++) {
      if (key === -1) {
        return temp
      }
      if (item[i].id === key) { // 找到自己
        if (item[i].parentId === -1) {
          return temp
        }
        if (item[i].tabType === TypeEnum.example.name) {
          temp.push(item[i].requestId)
          getMatchParent(treeData, item[i].requestId)
        } else {
          temp.push(item[i].parentId)
          getMatchParent(treeData, item[i].parentId)
        }
      }
      if (item[i].item && item[i].item.length > 0) {
        getMatchParent(item[i].item, key)
      }
    }
  }

  // const result = getMatchParent(items.value, targetParentId)
  getMatchParent(treeData, currentId)

  return temp
}

const electron = window.require('electron')
const { ipcRenderer } = electron

const handleDownload = (res) => {
  // Helper.testDownload(res);
  ipcRenderer.send('test-download', res)
}

const tabsData = {
  tabInfo,
  setCookie,
  setContentType,
  setAuthorization,
  clearAuthorization,
  searchAndUseVariables,
  setPrerequest,
  getFormattedPrerequest,
  getFormattedTestsScript,
  setTestsScript,
  preRequestScope,
  updateAuthorization,
  initCollectionData,
  initFolderData,
  initItemData,
  initWorkspaceData,
  checkTypeToInitAndUseData,
  initElementId,
  getParentData,
  useAndSetParentAuth,
  inheritedScope,
  updateInheritedScope,
  updateAndUseInheritedAuth,
  initUrlParamsAndPatchByParamKey,
  checkAndUpdateAuthorization,
  clearCookie,
  editSidebarItemName,
  initEnvironmentData,
  setResponseExampleData,
  initResponseExampleData,
  getCurrentItemData,
  handleResponseData,
  extractUrlParamsAndResetQuery,
  refreshUrl,
  classifyMethodColor,
  getAllParentKey,
  handleDownload,
  initElementId1,
  setScript,
  getFormattedScript,
  setContentTypeAndLength
}

export default tabsData

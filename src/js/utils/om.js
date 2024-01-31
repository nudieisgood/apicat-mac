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
import Request from '@/js/utils/om/request.js'
import Header from '@/js/utils/om/header.js'
import HeaderList from '@/js/utils/om/headerList.js'
import Cookie from '@/js/utils/om/cookie.js'
import CookieList from '@/js/utils/om/cookieList.js'
import Url from '@/js/utils/om/url.js'
import { defaultHeaders } from '@/js/config/header'
import variable from '@/js/utils/om/variable.js';
import VariableScope from '@/js/utils/om/variableScope1.js';


// const { CookieList } = require('@/js/utils/om/cookieList.js');
// const om2 = require('@/js/utils/om/index.js');
// console.log('CookieList__', CookieList)
// console.log('Url__', new Url('www.google.com'))
class om {}



let headerString = 'Content-Type: application/json\nUser-Agent: MyClientLibrary/2.0\n';
var rawHeaders = Header.parse(headerString);
// console.log('rawHeaders__', rawHeaders); // [{ 'Content-Type': 'application/json', 'User-Agent': 'MyClientLibrary/2.0' }]
var headers = rawHeaders.map(function (h) {
  return new Header(h);
});

let b = { key: 'Test-heelo', value: 'go' }
// console.log('headers__', headers);
let v =  {
     "id": "my-var-1",
    "name": "MyFirstVariable",
   "value": "Hello World",
   "type": "string"
 }

 let newVar = new variable(v)
// console.log('newVar.get()__', newVar.get());
// console.log('headers.add__', headers.add);
let a = new HeaderList()
// let a = new HeaderList(defaultHeaders, rawHeaders)
// a.add(b)
// console.log('a__', a)
// a.add({key: 'nonce', value: 3939889})
// console.log('after add a__', a)

const currentWorkspace = computed(() => {
  return store.getters.getCurrentWorkspace
})

const variablesState = computed(() => {
  return store.getters.getVariablesState;
})

watch(() => variablesState.value.collectionVariable, () => {
  // console.log('collectionVariable is change__', variablesState.value.collectionVariable)
  let collectionVarList = {
    id: Date.now(),
    name: 'Collection',
    values: variablesState.value.collectionVariable
  }
  om.collectionVariables = new VariableScope(collectionVarList)
}, {
  immediate: true
})

watch(() => currentWorkspace.value.variable, () => {
  // console.log('global is change__')
  let globalEnvList = {
    id: currentWorkspace.value.id,
    name: 'Globals',
    values: currentWorkspace.value.variable
  }
  om.globals = new VariableScope(globalEnvList)
}, {
  immediate: true
})

const environmentList = computed(() => {
  return store.getters.getEnvironmentList
})

const environmentId = computed(() => {
  return store.getters.getSelectedEnvironmentId
})

let envScope = []

watch(() => environmentList.value, () => {
  // console.log('environmentList.value__', environmentList.value)
  let mapEnvList =  environmentList.value.map((e)=>{
    return {
      id: e.id,
      name: e.name,
      values: e.variable,

    }
  })
  envScope = mapEnvList.map((e) => new VariableScope(e))
}, {
  immediate: true
})


const initOMEnvironment = () => {
  const currentEnv = environmentList.value.find((e)=>e.id === environmentId.value)
  if (currentEnv) {
    let obj = {
      id: currentEnv.id,
      name: currentEnv.name,
      values: currentEnv.variable,
    }

    om.environment = new VariableScope(obj)
  }
  // console.log(om.environment)
}

// console.log('mapEnvList__', mapEnvList)

// let testScope = mapEnvList.map((e) => new VariableScope(e))
// om.environment = testScope[7]
// console.log('om.environment__', om.environment)
// console.log('test env get__', om.environment? om.environment.get('holiday'): 'nothing')


let varScope = {
  "id": 123456,
  "name": "Apicat",
 "values": [{
   "key": "var-1",
   "value": "value-1",
   "type": "string",
   "disabled": false
    }, {
     "key": "var-2",
     "value": "value-2",
     "type": "string",
     "disabled": false
   }]
   }

// let varScope1 = {
// "name": "globals_1",
// "values": JSON.stringify([{
//   "key": "var-1",
//   "value": "value-1",
//   "type": "string",
//   "disabled": false
//   }, {
//     "key": "var-2",
//     "value": "value-2",
//     "type": "string",
//     "disabled": false
//   }])
// }
// console.log('varScope1__', varScope1)
// console.log('new varScope1__', new VariableScope(varScope1))

let newVarScope = new VariableScope(varScope)
// console.log('newVarScope__', newVarScope)
// console.log('newVarScope.get test__', newVarScope.get('var-1'))

const fs = require('fs')
const util = require('util');

// console.log('HI OM')
let myCookie = new Cookie({
name: 'my-cookie-name',
expires: '1464769543832', // UNIX timestamp, in *milliseconds*
maxAge: '300',  // In seconds. In this case, the Cookie is valid for 5 minutes
domain: 'something.example.com',
path: '/',
secure: false,
httpOnly: true,
session: false,
value: 'my-cookie-value',
extensions: [{
    key: 'Priority',
    value: 'HIGH'
}]
});
// console.log('myCookie__',myCookie)



// om.logger = console;

//NOTE: 2023/11/30
// For a Pre-request Script this is the request that's about to run, and for a Test script this is the request that has already run.


om.request = new Request()

om.isSendRequest = false

const sendRequest = async (payload, callback) => {
  om.isSendRequest = false
  const actualRequestData = setRequestData(payload)
  const obj = {
    id: Date.now(),
    submitData: actualRequestData
  }
  // const a = await ipcHttpRequest(obj, true)
  // console.log('a__', a)
  // return a
  await ipcHttpRequest(obj, true)
    .then(async(response) => {
      // requestData.preRequestResponseInfo.preRequestResponse = response
      om.isSendRequest = true
      callback(null, response)
      return response
    })
    .catch(error => {
      callback(error, null)
      return error
    })
}

om.sendRequest = sendRequest

/**
 * 原本定義在 requestData.js 處理傳入 setRequestData 的 tabInfo.request 內容如下：
 * {
 *  auth: {},
 *  body: {mode: '', raw: '', urlencoded: [], formdata: [], raw: '', urlencoded: [] ...},
 *  header: [],
 *  method: ''
 *  url: {}
 * }
 */

const requestDataParams = {
  method: '',
  url: '',
  header: {},
  body: undefined,
  dataType: ''
}


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


const responseData = computed(() => {
  return store.getters.getResponseData
})

const getResponseData = () => {
  if (JSON.stringify(responseData.value) !== '{}') {
    return responseData.value
  }
  return ''
}

om.response = {
  get: getResponseData
}

const currentTabData = computed(() => {
  return store.getters.getCurrentTabData;
});

const tabsPane = computed(() => {
  return store.getters.getTabsPane;
});

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
      return ''
    }

    const cookieString = cookieStore.findAndGenerateCookieString(matchCookie)

    return cookieString

  }
  return ''
}

const handleScript = async (preContent) => {
  let isDone = false
  function executeCodeInClosure(code) {
    return function() {
      return new Promise((resolve, reject) => {
        try {
          // Execute the code inside a function to prevent global contamination
          const functionToExecute = new Function('om', code);
          let isSendRequest = false
          functionToExecute({
            environment: {
              set: (key, value) => {
                om.environment.set(key, value)
              },
              get: (key) => {
                return om.environment.get(key)
              },
              unset: (key) => {
                om.environment.unset(key)
              }

            },
            globals: {
              set: (key, value) => om.globals.set(key, value),
              get: (key) => {
                return om.globals.get(key)
              },
              unset: (key) => {
                om.globals.unset(key)
              }
            },
            collectionVariables: {
              set: (key, value) => om.collectionVariables.set(key, value),
              get: (key) => {
                return om.collectionVariables.get(key)
              },
              unset: (key) => {
                om.collectionVariables.unset(key)
              }
            },
            variables: {
              get: (key) => {
                // variables 為 environment、globals、collection variable 的彙總，因有可能會先更新其他類型的變數，所以於執行 variables.get 時建立 om.variables
                let variablesList = {
                  id: `${Date.now()}-variables`,
                  name: 'variables',
                  values: [...om.environment.values, ...om.globals.values, ...om.collectionVariables.values]
                }
                om.variables = new VariableScope(variablesList)
                return om.variables.get(key)
              },
            },
            sendRequest: async (payload, callback) => {
              isSendRequest = true
              // Simulate asynchronous operation, replace with actual async logic
              const actualRequestData = setRequestData(payload)
              const obj = {
                id: Date.now(),
                submitData: actualRequestData
              }
              await ipcHttpRequest(obj, true)
              .then(async(response) => {
                // requestData.preRequestResponseInfo.preRequestResponse = response
                om.isSendRequest = true
                callback(null, response)
                resolve(response);
              })
              .catch(error => {
                callback(error, null)
                resolve(error);
              })
            },
            response: {
              get: () => {
                return om.response.get()
              }
            },
            request: {
              headers: new HeaderList()
            }
          });
          if (!isSendRequest) resolve("Execution completed successfully");
        } catch (error) {
          reject(error);
        }
      });
    };
  }

  async function executeCode() {
    initOMEnvironment()
    const closure = executeCodeInClosure(preContent);
    try {
      await closure();
      let variableScope = {
        globalVariable :om.globals.values || [],
        environmentVariable : om.environment? om.environment.values : [],
        collectionVariable: om.collectionVariables.values || []
      }

      store.commit("SET_VARIABLES_STATE", variableScope);
      isDone = true

    } catch (error) {
      console.error(error);
      isDone = false
    }
  }

  await executeCode();
  return isDone



}

om.handleScript = handleScript

watch(() => responseData.value, async (newVal, oldVal) => {
  if (JSON.stringify(responseData.value) === '{}' || !responseData.value) {
    return
  }

  if (responseData.value.status) {
    let testScriptResult = ''
    const result = tabsPane.value.find(e => e.tabKey === currentTabData.value.tabKey)
    if (result) {
      testScriptResult = tabsData.getFormattedTestsScript(result)
      if (testScriptResult) {
        const isDone = await handleScript(testScriptResult)
        if (isDone) {
          omScriptEventEnd()
          // 依據 test script 的內容，判斷是否要更新變數
          workspaceData.updateVariableData(testScriptResult)
        }
      }
    }
  }
}, {
  immediate: true
})



export default om

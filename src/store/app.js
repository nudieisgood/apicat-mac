import tabsData from '@/store/tabs'

const state = {
  workspaceState: {
    workspace: {}, // 當前 workspace
    item: [], // sidebar collection 結構
    environments: [],
    workspaceId: null, // 當前 workspace ID

    isInProgress: false, // 判斷getWorkspaceTree是否完成
    participantList: [], // 工作區成員
    workspaceList: [], // 當前所有 workspace 列表
  },

  requestState: {
    requestData: {
      method: '',
      url: '',
      header: {},
      body: undefined,
      dataType: ''
    }
  },

  responseState: {
    responseData: {},
    loading: false
  },

  cookieState: {
    cookies:[], // 對應 loki db 中的cookies
  },

  tabsState: {
    currentTabType: '',
    tabsPane: [], // 存tabs列表
    currentTabId: null,
    isUpdateCookies: false,
    originalTab: {},
    comparedTab:{},
    currentTabData: {}
  },

  variablesState: {
    collectionVariable: [],
    globalVariable: [],
    environmentVariable: []
  },

  lastOperationState: {
    workspaceId: null,
    workspaceArray: [],
  }
}

const mutations = {
  SET_WORKSPACE: (state, arg) => {
    //  console.log('SET_WORKSPACE__', arg)
    state.workspaceState.workspaceId = arg.workspaceId
    state.workspaceState.workspace = arg.workspace
    state.workspaceState.environments = arg.environments
    state.workspaceState.item = arg.item
  },

  SET_WORKSPACE_LIST: (state, workspaceList) => {
    state.workspaceState.workspaceList = workspaceList
  },

  SET_PARTICIPANT_LIST: (state, participantList) => {
    state.workspaceState.participantList = participantList
  },

  SET_COOKIES_LIST: (state, cookieList) => {
    state.cookieState.cookies = cookieList
  },

  SET_REQUEST_DATA: (state, requestData) => {
    state.requestState.requestData = requestData
  },

  CLEAR_REQUEST_DATA: (state) => {
    state.requestState.requestData = {
      method: '',
      url: '',
      header: {},
      body: undefined,
      dataType: ''
    }
  },

  SET_RESPONSE_DATA: (state, responseArg) => {
    state.responseState.responseData = responseArg.responseData
  },

  SET_CURRENT_TAB_RESPONSE_DATA: (state, responseArg) => {
    const result = state.tabsState.tabsPane.find(e => e.id === responseArg.requestId)
    if (result) {
      // NOTE: 取消請求時，保留前次發送請求回傳紀錄；所以當 responseArg.responseData 為 null時，不賦值
      // if (responseArg.responseData) {
      result.tempResponse = responseArg.responseData
      result.isSendingRequest = false
      // }

      // result.tempResponse = Object.assign({}, responseArg)
    }
  },

  RESET_RESPONSE_DATA: (state) => {
    state.responseState.responseData = {}
  },

  CLEAR_RESPONSE_DATA: (state, responseData) => {
    state.responseState.responseData = {}
  },

  RESET_APP_STATE: (state) => {
    state.workspaceState.workspace = {}
    state.workspaceState.item = []
    state.workspaceState.environments = []
    state.workspaceState.workspaceId = null
    state.workspaceState.isInProgress = false
    state.workspaceState.participantList = []
    state.workspaceState.workspaceList = []

    state.requestState.requestData.method = ''
    state.requestState.requestData.url = ''
    state.requestState.requestData.header = {}
    state.requestState.requestData.body = undefined
    state.requestState.requestData.dataType = ''

    state.responseState.responseData = {}
    state.responseState.loading = false

    state.cookieState.cookies = []

    state.tabsState.currentTabType = ''
    state.tabsState.tabsPane = []
    state.tabsState.currentTabId = null
    state.tabsState.isUpdateCookies = false
    state.tabsState.originalTab = {}
    state.tabsState.comparedTab = {}
    state.tabsState.currentTabData = {}

    state.lastOperationState.workspaceId = null
    state.lastOperationState.workspaceArray = []
  },

  RESET_WORKSPACE: (state) => {
    state.workspaceState.workspace = {}
    state.workspaceState.item = []
    state.workspaceState.environments = []
    state.workspaceState.workspaceId = null
    state.workspaceState.participantList = []
  },

  SET_TAB_TO_PANE: (state, tab) => {
    state.tabsState.tabsPane.push(tab)
  },

  SET_CURRENT_TAB_INFO: (state, tabInfo) => {
    state.tabsState.currentTabData = tabInfo;
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      foundWorkspace.selectedTabId = `${tabInfo.tabKey}-${tabInfo.tabType}`
    }
  },

  SET_TABS_PANE: (state) => {
    state.tabsState.tabsPane = getters.getTabsArray(state)
  },

  SET_VARIABLES_STATE: (state, {collectionVariable, globalVariable, environmentVariable}) => {
    state.variablesState.collectionVariable = collectionVariable || state.variablesState.collectionVariable
    state.variablesState.globalVariable = globalVariable || state.variablesState.globalVariable
    state.variablesState.environmentVariable = environmentVariable || state.variablesState.environmentVariable
  },

  // 以下為紀錄最後一次操作記錄 --start
  SET_WORKSPACE_ARRAY: (state, workspaceId) => {
    const workspaceData = {
      workspaceId: null,
      tabsArray: [],
      selectedTabId: '',
      environmentId: null,
      treeConfig: {
        expandedKeys: [], // 紀錄 sidebar 最後展開的節點id
        selectedTabData: {} // 紀錄 sidebar 最後一次選到的節點
      }
    }
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === workspaceId)

    if (!found) {
      workspaceData.workspaceId = workspaceId
      state.lastOperationState.workspaceArray.push(workspaceData)
    }
  },

  SET_TABS_ARRAY: (state, tabInfo) => {
    // 取得當前workspace資料
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      // 檢查tabsArray是否已有同樣資料
      const foundTab = foundWorkspace.tabsArray.find(e => e.tabKey === tabInfo.tabKey && e.tabType === tabInfo.tabType)

      if (!foundTab) {
        foundWorkspace.tabsArray.push(tabInfo)
      }
    }
  },

  SET_WORKSPACE_ID: (state, workspaceId) => {
    state.lastOperationState.workspaceId = workspaceId
  },

  RESET_WORKSPACE_ID: (state) => {
    state.lastOperationState.workspaceId = null
  },

  DELETE_SINGLE_TAB: (state, deleteKey) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      const foundIndex = foundWorkspace.tabsArray.findIndex(e => `${e.tabKey}-${e.tabType}` === deleteKey)
      if (foundIndex !== -1) {
        foundWorkspace.tabsArray.splice(foundIndex, 1)
      }
      state.tabsState.tabsPane = foundWorkspace.tabsArray
      if (!foundWorkspace.tabsArray.length) {
        foundWorkspace.selectedTabId = ''
        state.tabsState.currentTabData = {}
      }

    }
  },
  DELETE_MULTIPLE_TAB: (state, deleteKey) => {
    const deleteTabList = []
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    const deepSearch = (delKey) => {
      const foundTab = foundWorkspace.tabsArray.find(tab => tab.id === delKey)
      if (foundTab) {
        deleteTabList.push(foundTab)
      }
      foundWorkspace.tabsArray.forEach((tab) => {
        const parentKeyList = tabsData.getAllParentKey(state.workspaceState.item, tab.id)
        const resultIndex = parentKeyList.findIndex(e => e === deleteKey)
        if (resultIndex > -1) {
          const sameTab = deleteTabList.find(e => e.id === tab.id)
          if (!sameTab) {
            deleteTabList.push(tab)
          }
        }
      })
    }

    deepSearch(deleteKey)
    if (deleteTabList.length) {
      foundWorkspace.tabsArray = foundWorkspace.tabsArray.filter((tab) => !deleteTabList.includes(tab))
      state.tabsState.tabsPane = foundWorkspace.tabsArray
      // tabsData.tabInfo.tabsPane = foundWorkspace.tabsArray
      if (foundWorkspace.tabsArray.length === 0) {
        foundWorkspace.selectedTabId = ''
      } else {
        const lastTab = foundWorkspace.tabsArray[foundWorkspace.tabsArray.length - 1]
        foundWorkspace.selectedTabId = `${lastTab.tabKey}-${lastTab.tabType}`
        tabsData.tabInfo.currentTabId = lastTab.tabKey
      }
    }
  },
  DELETE_SINGLE_WORKSPACE: (state, workspaceId) => {
    const foundIndex = state.lastOperationState.workspaceArray.findIndex(e => e.workspaceId === workspaceId)

    if (foundIndex !== -1) {
      state.lastOperationState.workspaceArray.splice(foundIndex, 1)
    }
  },
  UPDATE_TAB: (state, tabInfo) => {
    if (!tabInfo) {
      return
    }
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {

      // 檢查tabsArray是否已有同樣資料
      const foundTab = foundWorkspace.tabsArray.find((e) => {
        return e.id === tabInfo.id && e.tabType === tabInfo.tabType
      })

      if (foundTab) {
        Object.assign(foundTab, tabInfo)
        // foundTab = tabInfo
      }
    }
  },

  SET_ENVIRONMENT_ID: (state, environmentId) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    // console.log('foundWorkspace__', foundWorkspace)
    if (foundWorkspace) {
      foundWorkspace.environmentId = environmentId
    }
  },

  CLEAR_ALL_TAB: (state) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      foundWorkspace.tabsArray = []
      state.tabsState.tabsPane = foundWorkspace.tabsArray
      // tabsData.tabInfo.tabsPane = foundWorkspace.tabsArray
    }
  },

  UPDATE_TAB_ARRAY: (state, tabArray) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      foundWorkspace.tabsArray = tabArray
    }
  },

  SET_TREE_EXPENDED_KEYS: (state, expandedKeys) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      foundWorkspace.treeConfig.expandedKeys = expandedKeys
    }

  },

  SET_TREE_SELECTED_TAB: (state, tab) => {
    const foundWorkspace = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (foundWorkspace) {
      foundWorkspace.treeConfig.selectedTabData = tab
    }
  },
  // 以下為紀錄最後一次操作記錄 --end
}

const getters = {
  getWorkspaceList(state) {
    return state.workspaceState.workspaceList
  },

  getParticipantList(state) {
    return state.workspaceState.participantList
  },

  getCurrentWorkspace (state) {
    return state.workspaceState.workspace
  },

  getEnvironmentList (state) {
    return state.workspaceState.environments
  },

  getWorkspaceState (state) {
    return state.workspaceState
  },

  getCurrentWorkspaceItems (state) {
    return state.workspaceState.item
  },

  getResponseData (state) {
    return state.responseState.responseData
  },

  getRequestData (state) {
    return state.requestState.requestData
  },

  getCookieData (state) {
    return state.cookieState.cookies
  },

  getTabsPane(state) {
    return state.tabsState.tabsPane
  },

  getCurrentTabData(state) {
    return state.tabsState.currentTabData
  },

  // getCurrentTabInfo(state) {

  // },

  getVariablesState(state) {
    return state.variablesState
  },

  // 以下為取得最後一次操作記錄 --start
  getTabsArray (state) {
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (found) {
      return found.tabsArray
    }
    return []
  },

  getSelectedTabId (state) {
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (found) {
      return found.selectedTabId
    }
    return null
  },

  getSelectedEnvironmentId (state) {
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (found) {
      return found.environmentId
    }
    return -1
  },

  getSelectedWorkspaceId(state) {
    return state.lastOperationState.workspaceId
  },

  getTreesExpendedKeys(state) {
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (found) {
      return found.treeConfig.expandedKeys
    }
    return []
  },

  getTreesSelectedTab(state) {
    const found = state.lastOperationState.workspaceArray.find(e => e.workspaceId === state.lastOperationState.workspaceId)
    if (found) {
      return found.treeConfig.selectedTabData
    }
    return []
  }
  // 以下為紀錄最後一次操作記錄 --end
}

export default {
  state,
  mutations,
  getters,
}

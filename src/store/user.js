
const state = {
  userState: {
    account: '',
    id: null,
    token: '',
    userName: '',
    isEditable: false
  },

  /**
 * account、password、userName、isAutoSetData 用在切換login及register時，相同欄位的資料可以直接帶入
 */
  loginState: {
    isKeepAccount: false, // 是否記住帳號
    account: '',
    password: '',
    userName: '',
    isAutoSetData: false
  }
}

const mutations = {
  SET_USER_INFO: (state, data) => {
    state.userState.account = data.account
    state.userState.id = data.id
    state.userState.token = data.token
    state.userState.userName = data.userName
  },

  UPDATE_USER_EDIT_RIGHT: (state, editRight) => {
    state.userState.isEditable = editRight
  },

  CLEAR_USER_INFO: (state, ) => {
    if (!state.loginState.isKeepAccount) {
      // 記住帳號的狀態下，不清除帳號
      state.userState.account = ''
    }
    state.userState.id = null
    state.userState.token = ''
    state.userState.userName = ''
    state.userState.isEditable = false
  },

  UPDATE_USER_NAME: (state, userName) => {
    state.userState.userName = userName
  },

  UPDATE_AUTO_SET_DATA_STATUS: (state, status) => {
    state.loginState.isAutoSetData = status
  },

  UPDATE_IS_KEEP_ACCOUNT_STATUS: (state, status) => {
    state.loginState.isKeepAccount = status
  },

  KEEP_ACCOUNT: (state, account) => {
    state.loginState.account = account
  },

  KEEP_USER_ACCOUNT: (state, account) => {
    state.userState.account = account
  },

  KEEP_PASSWORD: (state, password) => {
    state.loginState.password = password
  },

  KEEP_USERNAME: (state, userName) => {
    state.loginState.userName = userName
  },
}

const getters = {
  isEditable(state) {
    return state.userState.isEditable
  },

  getToken(state) {
    return state.userState.token
  },

  isKeepAccount(state) {
    return state.loginState.isKeepAccount
  },

  isAutoSetData(state) {
    return state.loginState.isAutoSetData
  },

  getKeepAccount(state) {
    return state.userState.account
  },

  getAccount(state) {
    return state.loginState.account
  },

  getPassword(state) {
    return state.loginState.password
  },

  getUserState(state) {
    return state.userState
  }
}

export default {
  state,
  mutations,
  getters,
}

// 用於紀錄 UI 方面的操作

const state = {
  isVerticalMode: true, // 控制request區塊 與 response區塊陳列方向
  onCollapse: false, // sidebar 是否為關閉狀態
  isShowLayoutLoading: false, // 是否顯示 shimmer 的 loading
  isAPIProcessing: false, // 是否在執行API
  isCancelRequest: false,
  isEnableCertificates: false, // 是否啟用 Certificates
}

const mutations = {
  SET_LAYOUT_MODE: (state, status) => {
    state.isVerticalMode = status
  },

  SET_SIDEBAR_MODE: (state, status) => {
    state.onCollapse = status
  },

  SET_SHOW_LAYOUT_LOADING_MODE: (state, status) => {
    state.isShowLayoutLoading = status
  },

  SET_PROCESSING_MODE: (state, status) => {
    state.isAPIProcessing = status
  },

  SET_CANCEL_REQUEST_STATUS: (state, status) => {
    state.isCancelRequest = status
  },

  SET_CERTIFICATES_STATUS: (state, status) => {
    state.isEnableCertificates =status
  }
}

const getters = {
  isVerticalMode(state) {
    return state.isVerticalMode
  },

  isOnCollapse(state) {
    return state.onCollapse
  },

  isShowLayoutLoading(state) {
    return state.isShowLayoutLoading
  },

  isAPIProcessing(state) {
    return state.isAPIProcessing
  },

  isCancelRequest(state) {
    return state.isCancelRequest
  },

  isEnableCertificates(state) {
    return state.isEnableCertificates
  }

}

export default {
  state,
  mutations,
  getters,
}

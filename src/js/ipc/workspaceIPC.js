import helper from '@/js/utils/helper.js'
import store from '@/store'
const jc = require('json-cycle')

const electron = window.require('electron')
const { ipcRenderer } = electron
// return new Promise((resolve, reject) => {})

// 新增Workspace
const createWorkspace = ({ workspaceName, summary, variable }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceName, summary, variable }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('create-workspace', arg)
    ipcRenderer.once('create-workspace-cb', (event, arg) => { resolve(arg) })
  })
}

// 編輯Workspace
const editWorkspace = ({ workspaceId, workspaceName, summary, variable }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, workspaceName, summary, variable }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('edit-workspace', arg)
    ipcRenderer.once('edit-workspace-cb', (event, arg) => { resolve(arg) })
  })
}

// 取得Workspace json tree
const getWorkspaceTree = ({ workspaceId }) => {
  return new Promise((resolve, reject) => {
    // store.commit("SET_SHOW_LAYOUT_LOADING_MODE", true);
    const params = { workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('get-workspace-tree', arg)
    ipcRenderer.once('get-workspace-tree-cb', (event, arg) => {
      // if (!arg) {
      //   return
      // }
      if (arg && arg.workspaceId) {
        store.commit("SET_WORKSPACE", arg);

      }
      resolve(arg)
      // store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
    })
  })
}

// 取得Workspace清單
const getWorkspaceList = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send('get-workspace-list')
    ipcRenderer.once('get-workspace-list-cb', (event, arg) => {
      if(!arg) return
      store.commit("SET_WORKSPACE_LIST", arg.data);
      resolve(arg)
    })

  })
}

// 根據id取得Workspace
const getWorkspace = ({ workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('get-workspace', arg)
    ipcRenderer.once('get-workspace-cb', (event, arg) => {
      resolve(arg)
    })
  })
}

// 刪除Workspace
const deleteWorkspace = ({ workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('delete-workspace', arg)
    ipcRenderer.once('delete-workspace-cb', (event, arg) => { resolve(arg) })
  })
}

// 取得該workspace完整活動紀錄(不含history內容)
const getWorkspaceActivity = ({ workspaceId, itemTypeList, userIdList, page, size }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, itemTypeList, userIdList, page, size }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('get-workspace-activity', arg)
    ipcRenderer.once('get-workspace-activity-cb', (event, arg) => { resolve(arg) })
  })
}

// 開啟一個tabt view
const openTabView = ({ workspaceId, id }) => {
  const params = { workspaceId, id }
  const arg = helper.apiRequestData(params)
  ipcRenderer.send('open-tab-view', arg)
}

// 關閉一個tab view
const closeTabView = ({ id }) => {
  const params = { id }
  const arg = helper.apiRequestData(params)
  ipcRenderer.send('close-tab-view', arg)
}

// 手動同步
const manualDoActivity = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send('manual-do-activity')
    ipcRenderer.once('manual-do-activity-cb', (event, arg) => { resolve(arg) })
  })
}

// 轉移工作區擁有者身分給其他參與者
const editWorkspaceOwner = ({ workspaceId, userId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, userId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('edit-workspace-owner', arg)
    ipcRenderer.once('edit-workspace-owner-cb', (event, arg) => { resolve(arg) })
  })
}

export {
  createWorkspace,
  editWorkspace,
  getWorkspaceTree,
  getWorkspaceList,
  getWorkspace,
  deleteWorkspace,
  getWorkspaceActivity,
  openTabView,
  closeTabView,
  manualDoActivity,
  editWorkspaceOwner
}

import helper from '@/js/utils/helper.js'
const jc = require('json-cycle')

const electron = window.require('electron')
const { ipcRenderer } = electron

// 新增Environment
const createEnvironment = ({ environmentName, workspaceId, variable }) => {
  return new Promise((resolve, reject) => {
    const params = { environmentName, workspaceId, variable }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('create-environment', arg)
    ipcRenderer.once('create-environment-cb', (event, arg) => { resolve(arg) })
  })
}

// 編輯Environment
const editEnvironment = ({ environmentId, workspaceId, environmentName, variable }) => {
  return new Promise((resolve, reject) => {
    const params = { environmentId, workspaceId, environmentName, variable }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('edit-environment', arg)
    ipcRenderer.once('edit-environment-cb', (event, arg) => { resolve(arg) })
  })
}

// 刪除Environment
const deleteEnvironment = ({ workspaceId, environmentId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, environmentId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('delete-environment', arg)
    ipcRenderer.once('delete-environment-cb', (event, arg) => { resolve(arg) })
  })
}

export { createEnvironment, editEnvironment, deleteEnvironment }

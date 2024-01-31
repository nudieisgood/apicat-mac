import helper from '@/js/utils/helper.js'
const jc = require('json-cycle')

const electron = window.require('electron')
const { ipcRenderer } = electron

// 新增Collection
const createCollection = ({ collectionsName, workspaceId, description, variable, event, auth }) => {
  return new Promise((resolve, reject) => {
    const params = { collectionsName, workspaceId, description, variable, event, auth }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('create-collection', arg)
    ipcRenderer.once('create-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 複製Collection
const copyCollection = ({ originalWorkspaceId, workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { originalWorkspaceId, workspaceId, collectionsId }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('copy-collection', arg)
    ipcRenderer.once('copy-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 編輯Collection
const editCollection = ({ collectionsId, workspaceId, collectionsName, description, variable, event, auth }) => {
  return new Promise((resolve, reject) => {
    const params = { collectionsId, workspaceId, collectionsName, description, variable, event, auth }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('edit-collection', arg)
    ipcRenderer.once('edit-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 刪除Collection
const deleteCollection = ({ workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, collectionsId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('delete-collection', arg)
    ipcRenderer.once('delete-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 匯入Collection
const importCollection = ({ files, workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { }
    params.workspaceId = workspaceId

    ipcRenderer.send('save-temp-file', files)
    ipcRenderer.once('save-temp-file-cb', (event, newFilePath) => {
      params.files = `file://${newFilePath}`
      const arg = helper.apiRequestData(params)
      ipcRenderer.send('import-collection', arg)
      ipcRenderer.once('import-collection-cb', (event, arg) => {
        resolve(arg)
        ipcRenderer.send('delete-temp-file', `${newFilePath}`)
      })
    })

    // params.files = `file://${files.path}`
    // const arg = helper.apiRequestData(params)
    // ipcRenderer.send('import-collection', arg)
    // ipcRenderer.once('import-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 匯出Collection
const exportCollection = ({ workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, collectionsId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('export-collection', arg)
    ipcRenderer.once('export-collection-cb', (event, arg) => { resolve(arg) })
  })
}

// 輸出至API文件
const downloadHtmlFile = ({ workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, collectionsId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('download-html-file', arg)
    ipcRenderer.once('download-html-file-cb', (event, arg) => { resolve(arg) })
  })
}

export { createCollection, copyCollection, editCollection, deleteCollection, importCollection, exportCollection, downloadHtmlFile }

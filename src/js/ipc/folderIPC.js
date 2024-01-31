import helper from '@/js/utils/helper.js'
const jc = require('json-cycle')

const electron = window.require('electron')
const { ipcRenderer } = electron

// 新增Folder
const createFolder = ({ workspaceId, parentId, folderName, description, variable, event, auth }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, parentId, folderName, description, variable, event, auth }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('create-folder', arg)
    ipcRenderer.once('create-folder-cb', (event, arg) => { resolve(arg) })
  })
}

// 複製Folder
const copyFolder = ({ originalWorkspaceId, workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { originalWorkspaceId, workspaceId, collectionsId }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('copy-folder', arg)
    ipcRenderer.once('copy-folder-cb', (event, arg) => { resolve(arg) })
  })
}

// 編輯Folder
const editFolder = ({ workspaceId, folderId, folderName, description, variable, event, auth }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, folderId, folderName, description, variable, event, auth }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('edit-folder', arg)
    ipcRenderer.once('edit-folder-cb', (event, arg) => { resolve(arg) })
  })
}

// 移動Folder
const moveFolder = ({ workspaceId, folderId, parentId, position }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, folderId, parentId, position }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('move-folder', arg)
    ipcRenderer.once('move-folder-cb', (event, arg) => { resolve(arg) })
  })
}

// 刪除Folder
const deleteFolder = ({ workspaceId, folderId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, folderId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('delete-folder', arg)
    ipcRenderer.once('delete-folder-cb', (event, arg) => { resolve(arg) })
  })
}

export { createFolder, copyFolder, editFolder, moveFolder, deleteFolder }

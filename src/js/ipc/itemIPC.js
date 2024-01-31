import helper from '@/js/utils/helper.js'
const jc = require('json-cycle')

const electron = window.require('electron')
const { ipcRenderer } = electron

// 新增Item
const createItem = ({ workspaceId, parentId, itemsName, description, event, request, response }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, parentId, itemsName, description, event, request, response }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('create-item', arg)
    ipcRenderer.once('create-item-cb', (event, arg) => { resolve(arg) })
  })
}

// 複製Item
const copyItem = ({ originalWorkspaceId, workspaceId, collectionsId }) => {
  return new Promise((resolve, reject) => {
    const params = { originalWorkspaceId, workspaceId, collectionsId }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('copy-item', arg)
    ipcRenderer.once('copy-item-cb', (event, arg) => { resolve(arg) })
  })
}

// 編輯Item
const editItem = ({ workspaceId, itemsId, itemsName, description, event, request, response }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, itemsId, itemsName, description, event, request, response }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('edit-item', arg)
    ipcRenderer.once('edit-item-cb', (event, arg) => { resolve(arg) })
  })
}

// 移動Item
const moveItem = ({ workspaceId, itemsId, parentId, position }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, itemsId, parentId, position }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('move-item', arg)
    ipcRenderer.once('move-item-cb', (event, arg) => { resolve(arg) })
  })
}

// 刪除Item
const deleteItem = ({ workspaceId, itemsId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, itemsId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('delete-item', arg)
    ipcRenderer.once('delete-item-cb', (event, arg) => { resolve(arg) })
  })
}

export { createItem, copyItem, editItem, moveItem, deleteItem }

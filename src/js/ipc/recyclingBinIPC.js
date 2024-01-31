import RecyclingBinItemTypeEnum, {getRecyclingBinItemValue} from "@/js/enum/recyclingBinItemTypeEnum.js";
import helper from '@/js/utils/helper.js'
const electron = window.require('electron')
const { ipcRenderer } = electron
const jc = require('json-cycle')

let obj = {
  workspace: RecyclingBinItemTypeEnum.workspace.value,
  collection: RecyclingBinItemTypeEnum.collection.value,
  folder: RecyclingBinItemTypeEnum.folder.value,
  request: RecyclingBinItemTypeEnum.request.value,
  envVariable: RecyclingBinItemTypeEnum.envVariable.value,
}


// 取得垃圾桶清單
const getRecyclingBinList = () => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send('get-recycling-bin-list')
    ipcRenderer.once('get-recycling-bin-list-cb', (event, arg) => { resolve(arg) })
  })
}

// 復原垃圾桶的資料
const restoreRecyclingBinData = ({ id, activityType }) => {
  return new Promise((resolve, reject) => {
    const params = { id, activityType }
    let arg = helper.apiRequestData(params)
    arg = jc.decycle(arg)
    ipcRenderer.send('restore-recycling-bin-data', arg)
    ipcRenderer.once('restore-recycling-bin-data-cb', (event, arg) => { resolve(arg) })
  })
}

// 手動刪除垃圾桶的資料 (單筆或多筆)
const deleteRecyclingBinData = (arg) => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send('delete-recycling-bin-data', arg)
    ipcRenderer.once('delete-recycling-bin-data-cb', (event, arg) => { resolve(arg) })
  })
}

export { getRecyclingBinList, restoreRecyclingBinData, deleteRecyclingBinData }

class RecyclingBinItemTypeEnum {
  // constructor ({
  //   value,
  //   name
  // }) {
  //   this.value = value
  //   this.name = name
  // }
}

RecyclingBinItemTypeEnum.workspace = {
  value: 0,
  name: '工作區',
  type: 'workspace'
}

RecyclingBinItemTypeEnum.collection = {
  value: 1,
  name: '集合',
  type: 'collection'
}

RecyclingBinItemTypeEnum.folder = {
  value: 2,
  name: 'folder',
  type: 'folder'
}

RecyclingBinItemTypeEnum.request = {
  value: 3,
  name: '請求',
  type: 'request'

}

RecyclingBinItemTypeEnum.envVariable = {
  value: 4,
  name: '環境變數',
  type: 'envVariable'
}

const recyclingBinItemTypeList = [RecyclingBinItemTypeEnum.workspace, RecyclingBinItemTypeEnum.collection, RecyclingBinItemTypeEnum.folder, RecyclingBinItemTypeEnum.request, RecyclingBinItemTypeEnum.envVariable]

const getRecyclingBinItemName = (value) => {
  const item = recyclingBinItemTypeList.find(e => e.value === value)
  return item.name
}

const getRecyclingBinItemType = (value) => {
  const item = recyclingBinItemTypeList.find(e => e.value === value)
  return item.type
}

const getRecyclingBinItemValue = (type) => {
  const item = recyclingBinItemTypeList.find(e => e.type === type)
  return item.value
}

export {
  recyclingBinItemTypeList, getRecyclingBinItemName,
  getRecyclingBinItemType, getRecyclingBinItemValue
}

export default RecyclingBinItemTypeEnum

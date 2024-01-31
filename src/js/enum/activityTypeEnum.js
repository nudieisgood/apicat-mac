class ActivityTypeEnum {}

ActivityTypeEnum.WORKSPACE = {
  value: 0,
  name: 'workspace'
}

ActivityTypeEnum.COLLECTION = {
  value: 1,
  name: 'collection'
}

ActivityTypeEnum.FOLDER = {
  value: 2,
  name: 'folder'
}

ActivityTypeEnum.ITEM = {
  value: 3,
  name: 'item'
}

ActivityTypeEnum.ENVIRONMENT = {
  value: 4,
  name: 'environment'
}

const typeList = [ActivityTypeEnum.WORKSPACE, ActivityTypeEnum.COLLECTION, ActivityTypeEnum.FOLDER, ActivityTypeEnum.ITEM, ActivityTypeEnum.ENVIRONMENT]

const getActivityNameFromValue = (value) => {
  const matchItem = typeList.find(item => item.value === value)
  return matchItem.name
}

export { typeList, getActivityNameFromValue }

export default ActivityTypeEnum

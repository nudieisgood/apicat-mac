class ActionTypeEnum {}

ActionTypeEnum.CREATE = {
  value: 0,
  name: 'create'
}

ActionTypeEnum.UPDATE = {
  value: 1,
  name: 'update'
}

ActionTypeEnum.DELETE = {
  value: 2,
  name: 'delete'
}

ActionTypeEnum.MOVE = {
  value: 3,
  name: 'move'
}

ActionTypeEnum.IMPORT = {
  value: 4,
  name: 'import'
}

const typeList = [ActionTypeEnum.CREATE, ActionTypeEnum.UPDATE, ActionTypeEnum.DELETE, ActionTypeEnum.MOVE, ActionTypeEnum.IMPORT]

const getNameFromValue = (value) => {
  const matchItem = typeList.find(item => item.value === value)
  return matchItem.name
}

export { typeList, getNameFromValue }

export default ActionTypeEnum

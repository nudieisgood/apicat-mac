class TypeEnum {
  // constructor ({
  //   value,
  //   name
  // }) {
  //   this.value = value
  //   this.name = name
  // }
}

TypeEnum.collection = {
  value: 0,
  name: 'collection'
}

TypeEnum.folder = {
  value: 1,
  name: 'folder'
}

TypeEnum.item = {
  value: 2,
  name: 'item'
}

TypeEnum.workspace = {
  value: 3,
  name: 'workspace'
}

TypeEnum.environment = {
  value: 4,
  name: 'environment'
}

TypeEnum.globals = {
  value: 5,
  name: 'globals'
}

TypeEnum.example = {
  value: 6,
  name: 'example'
}

const typeList = [TypeEnum.collection, TypeEnum.folder, TypeEnum.item, TypeEnum.workspace, TypeEnum.environment, TypeEnum.globals, TypeEnum.example]

const classifyType = (data) => {
  let type = ''
  if (data.parentId && data.parentId === -1) {
    type = TypeEnum.collection.name
  } else if (((data.parentId !== -1) && (!Object.prototype.hasOwnProperty.call(data, 'request')) && (Object.prototype.hasOwnProperty.call(data, 'item')))) {
    type = TypeEnum.folder.name
  } else if (Object.prototype.hasOwnProperty.call(data, 'request')) {
    type = TypeEnum.item.name
  } else if (Object.prototype.hasOwnProperty.call(data, 'originalRequest')) {
    type = TypeEnum.example.name
  }

  return type
}

export {
  typeList, classifyType
}

export default TypeEnum

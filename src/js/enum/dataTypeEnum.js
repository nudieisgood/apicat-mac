class DataTypeEnum {}

DataTypeEnum.NONE = {
  dataType: 'none',
  rawType: 'none'
}

DataTypeEnum.APPLICATION_JSON = {
  dataType: 'raw',
  rawType: 'application/json'
}

DataTypeEnum.MULTIPART_FORMDATA = {
  dataType: 'formdata',
  rawType: 'multipart/form-data'
}

DataTypeEnum.URLENCODED = {
  dataType: 'urlencoded',
  rawType: 'application/x-www-form-urlencoded'
}

const dataTypeList = [DataTypeEnum.NONE, DataTypeEnum.MULTIPART_FORMDATA, DataTypeEnum.URLENCODED, DataTypeEnum.APPLICATION_JSON]

const getRawTypeFromDataType = (dataType) => {
  const type = dataTypeList.find(e => e.dataType === dataType)
  return type
}

const getDataTypeFromRawType = (rawType) => {
  const type = dataTypeList.find(e => e.rawType === rawType)
  return type
}

export { dataTypeList, getRawTypeFromDataType, getDataTypeFromRawType }

export default DataTypeEnum

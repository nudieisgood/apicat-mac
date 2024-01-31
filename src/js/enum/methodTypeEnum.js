class MethodTypeEnum {}

MethodTypeEnum.GET = {
    id: 0,
    label: "GET",
    value: "GET",
}

MethodTypeEnum.POST = {
  id: 1,
  label: "POST",
  value: "POST",
}

MethodTypeEnum.DELETE = {
  id: 2,
  label: "DELETE",
  value: "DELETE",
}

MethodTypeEnum.PATCH = {
  id: 3,
  label: "PATCH",
  value: "PATCH",
}

const methodTypeList = [MethodTypeEnum.GET, MethodTypeEnum.POST, MethodTypeEnum.DELETE, MethodTypeEnum.PATCH]

const getMethodName = (value) => {
  const matchItem = methodTypeList.find(item => item.value === value)
  return matchItem.name
}

export { methodTypeList, getMethodName }
export default MethodTypeEnum

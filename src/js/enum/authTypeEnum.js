class AuthTypeEnum {}

AuthTypeEnum.NOAUTH = 'noauth'
AuthTypeEnum.BEARER = 'bearer'
AuthTypeEnum.INHERIT = 'inherit'

const authTypeList = [AuthTypeEnum.NOAUTH, AuthTypeEnum.BEARER, AuthTypeEnum.INHERIT]

export { authTypeList }
export default AuthTypeEnum

class ResStatusEnum {}

// 1xx Informational
ResStatusEnum.CONTINUE = {
  code: 100,
  name: 'Continue',
  desc: 'Continue'
}

ResStatusEnum.SWITCHING_PROTOCOLS = {
  code: 101,
  name: 'SwitchingProtocols',
  desc: 'Switching Protocols'
}

ResStatusEnum.PROCESSING = {
  code: 102,
  name: 'Processing',
  desc: 'Processing'
}

ResStatusEnum.EARLY_HINTS = {
  code: 103,
  name: 'EarlyHints',
  desc: 'Early Hints'
}

// 2xx Success
ResStatusEnum.OK = {
  code: 200,
  name: 'OK',
  desc: 'OK'
}

ResStatusEnum.CREATED = {
  code: 201,
  name: 'Created',
  desc: 'Created'
}

ResStatusEnum.ACCEPTED = {
  code: 202,
  name: 'Accepted',
  desc: 'Accepted'
}

ResStatusEnum.NON_AUTHORITATIVE_INFORMATION = {
  code: 203,
  name: 'NonAuthoritativeInformation',
  desc: 'Non-Authoritative Information'
}

ResStatusEnum.NOCONTENT = {
  code: 204,
  name: 'NoContent',
  desc: 'No Content'
}

ResStatusEnum.RESET_CONTENT = {
  code: 205,
  name: 'ResetContent',
  desc: 'Reset Content'
}

ResStatusEnum.PARTIAL_CONTENT = {
  code: 206,
  name: 'PartialContent',
  desc: 'Partial Content'
}

ResStatusEnum.MULTI_STATUS = {
  code: 207,
  name: 'MultiStatus',
  desc: 'Multi-Status'
}

ResStatusEnum.ALREADY_REPORTED = {
  code: 208,
  name: 'AlreadyReported',
  desc: 'Already Reported'
}

ResStatusEnum.IMUSED = {
  code: 226,
  name: 'IMUsed',
  desc: 'IM Used'
}

// 3xx Redirection
ResStatusEnum.MULTIPLE_CHOICES = {
  code: 300,
  name: 'MultipleChoices',
  desc: 'Multiple Choices'
}

ResStatusEnum.MOVED_PERMANENTLY = {
  code: 301,
  name: 'MovedPermanently',
  desc: 'Moved Permanently'
}

ResStatusEnum.FOUND = {
  code: 302,
  name: 'Found',
  desc: 'Found'
}

ResStatusEnum.SEE_OTHER = {
  code: 303,
  name: 'SeeOther',
  desc: 'See Other'
}

ResStatusEnum.NOT_MODIFIED = {
  code: 304,
  name: 'NotModified',
  desc: 'Not Modified'
}

ResStatusEnum.USE_PROXY = {
  code: 305,
  name: 'UseProxy',
  desc: 'Use Proxy'
}

ResStatusEnum.TEMPORARY_REDIRECT = {
  code: 307,
  name: 'TemporaryRedirect',
  desc: 'Temporary Redirect'
}

ResStatusEnum.PERMANENT_REDIRECT = {
  code: 308,
  name: 'PermanentRedirect',
  desc: 'Permanent Redirect'
}

// 4xx Client Error
ResStatusEnum.BAD_REQUEST = {
  code: 400,
  name: 'BadRequest',
  desc: 'Bad Request'
}

ResStatusEnum.UNAUTHORIZED = {
  code: 401,
  name: 'Unauthorized',
  desc: 'Unauthorized'
}

ResStatusEnum.PAYMENT_REQUIRED = {
  code: 402,
  name: 'PaymentRequired',
  desc: 'Payment Required'
}

ResStatusEnum.FORBIDDEN = {
  code: 403,
  name: 'Forbidden',
  desc: 'Forbidden'
}

ResStatusEnum.NOT_FOUND = {
  code: 404,
  name: 'NotFound',
  desc: 'Not Found'
}

ResStatusEnum.METHOD_NOT_ALLOWED = {
  code: 405,
  name: 'MethodNotAllowed',
  desc: 'Method Not Allowed'
}

ResStatusEnum.NOT_ACCEPTABLE = {
  code: 406,
  name: 'NotAcceptable',
  desc: 'Not Acceptable'
}

ResStatusEnum.PROXY_AUTHENTICATION_REQUIRED = {
  code: 407,
  name: 'ProxyAuthenticationRequired',
  desc: 'Proxy Authentication Required'
}

ResStatusEnum.REQUEST_TIMEOUT = {
  code: 408,
  name: 'RequestTimeout',
  desc: 'Request Timeout'
}

ResStatusEnum.CONFLICT = {
  code: 409,
  name: 'Conflict',
  desc: 'Conflict'
}

ResStatusEnum.GONE = {
  code: 410,
  name: 'Gone',
  desc: 'Gone'
}

ResStatusEnum.LENGTH_REQUIRED = {
  code: 411,
  name: 'LengthRequired',
  desc: 'Length Required'
}

ResStatusEnum.PRECONDITION_FAILED = {
  code: 412,
  name: 'PreconditionFailed',
  desc: 'Precondition Failed'
}

ResStatusEnum.PAYLOAD_TOO_LARGE = {
  code: 413,
  name: 'PayloadTooLarge',
  desc: 'Payload Too Large'
}

ResStatusEnum.REQUEST_URI_TOO_LONG = {
  code: 414,
  name: 'RequestURITooLong',
  desc: 'Request-URI Too Long'
}

ResStatusEnum.UNSUPPORTED_MEDIA_TYPE = {
  code: 415,
  name: 'UnsupportedMediaType',
  desc: 'Unsupported Media Type'
}

ResStatusEnum.REQUESTED_RANGE_NOT_SATISFIABLE = {
  code: 416,
  name: 'RequestedRangeNotSatisfiable',
  desc: 'Requested Range Not Satisfiable'
}

ResStatusEnum.EXPECTATION_FAILED = {
  code: 417,
  name: 'ExpectationFailed',
  desc: 'Expectation Failed'
}

ResStatusEnum.IM_A_TEAPOT = {
  code: 418,
  name: 'ImATeapot',
  desc: 'I\'m a teapot'
}

ResStatusEnum.MISDIRECTED_REQUEST = {
  code: 421,
  name: 'MisdirectedRequest',
  desc: 'Misdirected Request'
}

ResStatusEnum.UNPROCESSABLE_ENTITY = {
  code: 422,
  name: 'UnprocessableEntity',
  desc: 'Unprocessable Entity'
}

ResStatusEnum.LOCKED = {
  code: 423,
  name: 'Locked',
  desc: 'Locked'
}

ResStatusEnum.FAILED_DEPENDENCY = {
  code: 424,
  name: 'FailedDependency',
  desc: 'Failed Dependency'
}

ResStatusEnum.UPGRADE_REQUIRED = {
  code: 426,
  name: 'UpgradeRequired',
  desc: 'Upgrade Required'
}

ResStatusEnum.PRECONDITION_REQUIRED = {
  code: 428,
  name: 'PreconditionRequired',
  desc: 'Precondition Required'
}

ResStatusEnum.TOO_MANY_REQUESTS = {
  code: 429,
  name: 'TooManyRequests',
  desc: 'Too Many Requests'
}

ResStatusEnum.REQUEST_HEADER_FIELDS_TOO_LARGE = {
  code: 431,
  name: 'RequestHeaderFieldsTooLarge',
  desc: 'Request Header Fields Too Large'
}

ResStatusEnum.CONNECTION_CLOSED_WITHOUT_RESPONSE = {
  code: 444,
  name: 'ConnectionClosedWithoutResponse',
  desc: 'Connection Closed Without Response'
}

ResStatusEnum.UNAVAILABLE_FOR_LEGAL_REASONS = {
  code: 451,
  name: 'UnavailableForLegalReasons',
  desc: 'Unavailable For Legal Reasons'
}

ResStatusEnum.CLIENT_CLOSED_REQUEST = {
  code: 499,
  name: 'ClientClosedRequest',
  desc: 'Client Closed Request'
}

// 5xx Server Error
ResStatusEnum.INTERNAL_SERVER_ERROR = {
  code: 500,
  name: 'InternalServerError',
  desc: 'Internal Server Error'
}

ResStatusEnum.NOT_IMPLEMENTED = {
  code: 501,
  name: 'NotImplemented',
  desc: 'Not Implemented'
}

ResStatusEnum.BAD_GATEWAY = {
  code: 502,
  name: 'BadGateway',
  desc: 'Bad Gateway'
}

ResStatusEnum.SERVICE_UNAVAILABLE = {
  code: 503,
  name: 'ServiceUnavailable',
  desc: 'Service Unavailable'
}

ResStatusEnum.GATEWAY_TIMEOUT = {
  code: 504,
  name: 'GatewayTimeout',
  desc: 'Gateway Timeout'
}

ResStatusEnum.HTTP_VERSION_NOT_SUPPORTED = {
  code: 505,
  name: 'HTTPVersionNotSupported',
  desc: 'HTTP Version Not Supported'
}

ResStatusEnum.VARIANT_ALSO_NEGOTIATES = {
  code: 506,
  name: 'VariantAlsoNegotiates',
  desc: 'Variant Also Negotiates'
}

ResStatusEnum.INSUFFICIENT_STORAGE = {
  code: 507,
  name: 'InsufficientStorage',
  desc: 'Insufficient Storage'
}

ResStatusEnum.LOOP_DETECTED = {
  code: 508,
  name: 'LoopDetected',
  desc: 'Loop Detected'
}

ResStatusEnum.NOT_EXTENDED = {
  code: 510,
  name: 'NotExtended',
  desc: 'Not Extended'
}

ResStatusEnum.NETWORK_AUTHENTICATION_REQUIRED = {
  code: 511,
  name: 'NetworkAuthenticationRequired',
  desc: 'Network Authentication Required'
}

ResStatusEnum.NETWORK_CONNECT_TIMEOUT_ERROR = {
  code: 599,
  name: 'NetworkConnectTimeoutError',
  desc: 'Network Connect Timeout Error'
}

const resStatusList = [
  ResStatusEnum.CONTINUE,
  ResStatusEnum.SWITCHING_PROTOCOLS,
  ResStatusEnum.PROCESSING,
  ResStatusEnum.EARLY_HINTS,
  ResStatusEnum.OK,
  ResStatusEnum.CREATED,
  ResStatusEnum.ACCEPTED,
  ResStatusEnum.NON_AUTHORITATIVE_INFORMATION,
  ResStatusEnum.NOCONTENT,
  ResStatusEnum.RESET_CONTENT,
  ResStatusEnum.PARTIAL_CONTENT,
  ResStatusEnum.MULTI_STATUS,
  ResStatusEnum.ALREADY_REPORTED,
  ResStatusEnum.IMUSED,
  ResStatusEnum.MULTIPLE_CHOICES,
  ResStatusEnum.MOVED_PERMANENTLY,
  ResStatusEnum.FOUND,
  ResStatusEnum.SEE_OTHER,
  ResStatusEnum.NOT_MODIFIED,
  ResStatusEnum.USE_PROXY,
  ResStatusEnum.TEMPORARY_REDIRECT,
  ResStatusEnum.PERMANENT_REDIRECT,
  ResStatusEnum.BAD_REQUEST,
  ResStatusEnum.UNAUTHORIZED,
  ResStatusEnum.PAYMENT_REQUIRED,
  ResStatusEnum.FORBIDDEN,
  ResStatusEnum.NOT_FOUND,
  ResStatusEnum.METHOD_NOT_ALLOWED,
  ResStatusEnum.NOT_ACCEPTABLE,
  ResStatusEnum.PROXY_AUTHENTICATION_REQUIRED,
  ResStatusEnum.REQUEST_TIMEOUT,
  ResStatusEnum.CONFLICT,
  ResStatusEnum.GONE,
  ResStatusEnum.LENGTH_REQUIRED,
  ResStatusEnum.PRECONDITION_FAILED,
  ResStatusEnum.PAYLOAD_TOO_LARGE,
  ResStatusEnum.REQUEST_URI_TOO_LONG,
  ResStatusEnum.UNSUPPORTED_MEDIA_TYPE,
  ResStatusEnum.REQUESTED_RANGE_NOT_SATISFIABLE,
  ResStatusEnum.EXPECTATION_FAILED,
  ResStatusEnum.IM_A_TEAPOT,
  ResStatusEnum.MISDIRECTED_REQUEST,
  ResStatusEnum.UNPROCESSABLE_ENTITY,
  ResStatusEnum.LOCKED,
  ResStatusEnum.FAILED_DEPENDENCY,
  ResStatusEnum.UPGRADE_REQUIRED,
  ResStatusEnum.PRECONDITION_REQUIRED,
  ResStatusEnum.TOO_MANY_REQUESTS,
  ResStatusEnum.REQUEST_HEADER_FIELDS_TOO_LARGE,
  ResStatusEnum.CONNECTION_CLOSED_WITHOUT_RESPONSE,
  ResStatusEnum.UNAVAILABLE_FOR_LEGAL_REASONS,
  ResStatusEnum.CLIENT_CLOSED_REQUEST,
  ResStatusEnum.INTERNAL_SERVER_ERROR,
  ResStatusEnum.NOT_IMPLEMENTED,
  ResStatusEnum.BAD_GATEWAY,
  ResStatusEnum.SERVICE_UNAVAILABLE,
  ResStatusEnum.GATEWAY_TIMEOUT,
  ResStatusEnum.HTTP_VERSION_NOT_SUPPORTED,
  ResStatusEnum.VARIANT_ALSO_NEGOTIATES,
  ResStatusEnum.INSUFFICIENT_STORAGE,
  ResStatusEnum.LOOP_DETECTED,
  ResStatusEnum.NOT_EXTENDED,
  ResStatusEnum.NETWORK_AUTHENTICATION_REQUIRED,
  ResStatusEnum.NETWORK_CONNECT_TIMEOUT_ERROR
]

const getStatusDesc = (code) => {
  const matchItem = resStatusList.find(status => status.code === code)
  if (!matchItem) {
    return
  }
  return matchItem.desc
}

export { resStatusList, getStatusDesc }
export default ResStatusEnum

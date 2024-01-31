// const defaultHeaders = {
//   'User-Agent': 'OKManRuntime',
//   Accept: '*/*',
//   'Accept-Encoding': 'gzip, deflate',
//   Connection: 'keep-alive'
// }
const defaultHeaders = {
  'Cache-Control': 'no-cache',
  'Host': '<calculated when request is sent>',
  'User-Agent': 'ApiCatRuntime',
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
}

export { defaultHeaders }

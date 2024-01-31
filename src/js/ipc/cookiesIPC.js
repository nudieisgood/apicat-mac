import store from '@/store'

const electron = window.require('electron')
const { ipcRenderer } = electron

const createCookiesDomain = (arg) => {
  const data = {
    domain: arg.domain,
    cookies: arg.cookies
  }
  ipcRenderer.send('create-cookies-domain', data)
}

ipcRenderer.on('create-cookies-domain-cb', (event, arg) => {
  store.commit("SET_COOKIES_LIST", arg);
})

const updateCookiesDomain = (arg) => {
  const data = {
    domain: arg.domain,
    cookies: arg.cookies
  }
  // reactive 物件可能包含一些帶有方法和/或其他不可cloned屬性, 導致報錯"An object could not be cloned", 所以需要做以下處理
  const sendData = JSON.parse(JSON.stringify(data))
  ipcRenderer.send('update-cookies-domain', sendData)
}

ipcRenderer.on('update-cookies-domain-cb', (event, arg) => {
  store.commit("SET_COOKIES_LIST", arg);
})

const getCookiesDomains = () => {
  ipcRenderer.send('get-cookies-domains')
}

ipcRenderer.on('get-cookies-domains-cb', (event, arg) => {
  store.commit("SET_COOKIES_LIST", arg);
})

const removeCookiesDomain = (arg) => {
  const data = {
    domain: arg.domain
  }
  ipcRenderer.send('remove-cookies-domain', data)
}

ipcRenderer.on('remove-cookies-domain-cb', (event, arg) => {
  store.commit("SET_COOKIES_LIST", arg);
})

export { createCookiesDomain, updateCookiesDomain, getCookiesDomains, removeCookiesDomain }

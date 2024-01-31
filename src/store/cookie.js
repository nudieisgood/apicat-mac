import { reactive, computed, watch } from 'vue'
import { createCookiesDomain, updateCookiesDomain } from '@/js/ipc/cookiesIPC.js'

import tabsData from '@/store/tabs'
import TypeEnum from '@/js/enum/typeEnum.js'
import store from '@/store'

/**
 * 此為cookie引擎
 * 連動部分有三塊: cookie dialog, request url bar, response header
 */

const cookiesConfig = reactive({
  initVal: 0,
  domain: '',
  path: '',
  setCookieVal: '',
  setCookieInfo: {},
  isUpdated: false // 紀錄編輯cookie設定彈窗是否按下save鍵或刪除cookie tag
})

// NOTE: 20231201 改從共用資料區取 cookie 清單
const cookiesDB = computed(() => {
  return store.getters.getCookieData
})

const tabsPane = computed(() => {
  return store.getters.getTabsPane;
});

// 取得當前tab資料
const currentTabData = computed(() => {
  return store.getters.getCurrentTabData;
});

// URL輸入框
const url = computed(() => {
  // console.log(currentTabData.value)
  if (!currentTabData.value) return
  const result = tabsPane.value.find(e => e.tabKey === currentTabData.value.tabKey)
  if (result && result.tabType === TypeEnum.item.name) {
    // 先透過 searchAndUseVariables 判斷url是否有使用變數，若有則回傳轉換後的值；無則返回原值
    return tabsData.searchAndUseVariables(result.request.url.raw)
  }
  return ''
})

/*
判斷當前的cookie項目是否有符合request URL的Path，這裡採取拆成陣列逐一比對，例：
cookie Path 為 /CM/B => ["CM", "B"]
request URL的Path 為 /CM/ATH => ["CM", "ATH"]
*/
const findAndGenerateCookieString = (cookies) => {
  const ary = []
  cookies = JSON.parse(JSON.stringify(cookies))
  const matches = url.value.match(/https?:\/\/(?:.*?)(\/.*)/) || url.value.match(/(?:.*?)(\/.*)/) // 區別有http開頭或沒有的狀況

  if (!matches || matches.length < 2) {
    return
  }
  let requestPath = matches[1]
  if (requestPath.charAt(requestPath.length - 1) !== '/') {
    requestPath += '/'
  }

  cookies.cookies.forEach(cookieStr => {
    let path = cookieStr.match(/path=(.*?);/i)[1]

    if (path.charAt(path.length - 1) !== '/') {
      path += '/'
    }

    if (requestPath.startsWith(path)) {
      const keyValStr = cookieStr.match(/(^.*?);/)[1]
      ary.push(keyValStr)
    }
  })

  return ary.join(';')
}

/**
 * 從response的set-cookie header(陣列型別)中取出cookie value
 * Ex: SESSION=NDZjMWM4YjEtODA3MC00M2FmLTgxY2QtNzVjMzdiMGNiMzUy; Path=/; Secure; HttpOnly; SameSite=Lax
 * 從中取出SESSION=NDZjMWM4YjEtODA3MC00M2FmLTgxY2QtNzVjMzdiMGNiMzUy;
 */
const extractCookieString = (setCookieHeaderArray) => {
  if (setCookieHeaderArray && Array.isArray(setCookieHeaderArray)) {
    const cookieStringArray = []

    setCookieHeaderArray.forEach(e => {
      const keyValStr = e.match(/(^.*?);/)[1]
      cookieStringArray.push(keyValStr)
    })

    return cookieStringArray.join(';')
  }
}

// cookie有變化時, 需與 Http Header 連動
const checkCookiesDBAndUpdateHeader = (cookies) => {
  if (cookies.length === 0) { // cookiesDB 沒資料時，若 currentTab-Header 有cookie項目則移除
    tabsData.clearCookie(currentTabData.value)
    return
  }

  const matchDomain = cookies.find((e) => url.value.includes(e.domain))

  if (!matchDomain) { // cookiesDB 找不到符合的domain項目時，若 currentTab-Header 有該域名的cookie須移除
    tabsData.clearCookie(currentTabData.value)
    return
  }
  if (matchDomain.cookies.length === 0) { // 該domain下沒任何cookie項目時，若 currentTab-Header 有該域名的cookie須移除
    tabsData.clearCookie(currentTabData.value)
    return
  }

  if (cookiesConfig.isUpdated) { // 在彈窗有做更新/刪除動作時，進行path比對
    const cookieString = findAndGenerateCookieString(matchDomain)
    if (!cookieString) { // 若為[]表示沒有符合的cookie項目須帶入header；若 currentTab-Header 有該域名的cookie須移除
      tabsData.clearCookie(currentTabData.value)
      return
    }

    tabsData.setCookie(cookieString, currentTabData.value)
  } else {
    const cookieString = findAndGenerateCookieString(matchDomain)
    tabsData.setCookie(cookieString, currentTabData.value)
  }
}

// 監聽URL變化, 然後去cookie中找尋匹配的cookie by cookie's domain & path
watch(url, () => {
  if (!url.value) return

  const matches = url.value.match(/http[s]?:\/\/([.\-a-z0-9]*)\/?/)
  if (!matches || matches.length < 2) { // 沒有找到匹配的
    return
  }

  const domain = matches[1]

  if (cookiesDB.value.length > 0) {
    const matchCookie = cookiesDB.value.find((e) => e.domain === domain)

    if (!matchCookie || matchCookie.cookies.length === 0) { // 找不到符合的domain
      tabsData.clearCookie(currentTabData.value)
      return
    }

    const cookieString = findAndGenerateCookieString(matchCookie)
    if (!cookieString) { // 若為[]表示沒有符合的cookie項目須帶入header；若currentTab-Header有該域名的cookie須移除
      tabsData.clearCookie(currentTabData.value)
      return
    }

    tabsData.setCookie(cookieString, currentTabData.value)
  }
}, {
  immediate: true
})

watch(currentTabData, () => {
  if (!currentTabData.value) return
  checkCookiesDBAndUpdateHeader(cookiesDB.value)

}, {
  immediate: true
})



// 監聽cookie設定變化, 並連動到Http Header上；但這個連動只有當下的 tab會有作用，切換其他tab時則無效；於是另外監聽 currentTabData，當切換 tab時，進行相同處理
watch(() => cookiesDB.value, () => {
  checkCookiesDBAndUpdateHeader(cookiesDB.value)
}, {
  deep: true,
})

const responseData = computed(() => {
  return store.getters.getResponseData
})

// 判斷 response headers 是否含有Set-Cookie, 並自動設定到cookie上
watch(responseData, (res) => {
  if (JSON.stringify(res) === '{}' || !res) return
  if (res.status === 200) {
    if (Object.prototype.hasOwnProperty.call(res.headers, 'set-cookie')) { // response header 有 set-cookie項目
      const matches = url.value.match(/http[s]?:\/\/([.\-a-z0-9]*)\/?/) || url.value.match(/([.\-a-z0-9]*)\/?/) // 區別有http開頭或沒有的狀況
      if (!matches || matches.length < 2) { // 沒有找到匹配的
        return
      }

      const pathReg = /path=(.*?);/i
      const nameReg = /([^=]+)=/i
      const domain = matches[1]

      const data = {
        domain,
        cookies: res.headers['set-cookie']
      }

      const cookiePath = data.cookies[0].match(pathReg)[1]
      const cookieName = data.cookies[0].match(nameReg)[1]

      const cookieArray = res.headers['set-cookie']
      const cookieString = extractCookieString(cookieArray)

      const existDomainCookie = cookiesDB.value.some(e => e.domain === domain)
      const existDomainCookieData = cookiesDB.value.find(e => e.domain === domain)

      if (existDomainCookieData) {
        if (existDomainCookieData.cookies && existDomainCookieData.cookies.length > 0) {
          existDomainCookieData.cookies.forEach((e, index) => {
            const path = e.match(pathReg)[1]
            const name = e.match(nameReg)[1]
            if (path === cookiePath && name === cookieName) {
              existDomainCookieData.cookies.splice(index, 1) // 將舊的cookie刪掉，透過下方展開運算符設定新的cookie及既有的cookie
            }
          })

          data.cookies = [...data.cookies, ...existDomainCookieData.cookies]
        }
      }
      // reactive 物件可能包含一些帶有方法和/或其他不可cloned屬性, 導致報錯"An object could not be cloned", 所以須要做以下處理
      const cookieData = JSON.parse(JSON.stringify(data))

      if (cookieString.slice(-1) === '=') { // 如果cookieString後面沒值，EX:SESSION=;，將此cookie從cookieData.cookies移除
        const findIndex = cookieData.cookies.findIndex(e => e.indexOf(cookieString) > -1)

        if (findIndex > -1) {
          cookieData.cookies.splice(findIndex, 1)
        }
      }

      if (!existDomainCookie) { // cookiesDB 沒資料時，將set-cookie資料新增至彈窗、currentTab-Header
        createCookiesDomain(cookieData)
      } else { // cookiesDB 有資料時，先判斷有無新增過，若無則將set-cookie資料新增至彈窗、currentTab-Header；有的話則更新
        updateCookiesDomain(cookieData)
      }
    }
  }

}, {
  deep: true
})

// NOTE: 沒用到的話需移除
const handleCookieFromResponse = (res) => {
  if (res.status === 200)  {
    if (Object.prototype.hasOwnProperty.call(res.headers, 'set-cookie')) { // response header 有 set-cookie項目
      const matches = url.value.match(/http[s]?:\/\/([.\-a-z0-9]*)\/?/) || url.value.match(/([.\-a-z0-9]*)\/?/) // 區別有http開頭或沒有的狀況
      if (!matches || matches.length < 2) { // 沒有找到匹配的
        return
      }

      const pathReg = /path=(.*?);/i
      const nameReg = /([^=]+)=/i
      const domain = matches[1]

      const data = {
        domain,
        cookies: res.headers['set-cookie']
      }

      const cookiePath = data.cookies[0].match(pathReg)[1]
      const cookieName = data.cookies[0].match(nameReg)[1]

      const cookieArray = res.headers['set-cookie']
      const cookieString = extractCookieString(cookieArray)

      const existDomainCookie = cookiesDB.value.some(e => e.domain === domain)
      const existDomainCookieData = cookiesDB.value.find(e => e.domain === domain)

      if (existDomainCookieData) {
        if (existDomainCookieData.cookies && existDomainCookieData.cookies.length > 0) {
          existDomainCookieData.cookies.forEach((e, index) => {
            const path = e.match(pathReg)[1]
            const name = e.match(nameReg)[1]
            if (path === cookiePath && name === cookieName) {
              existDomainCookieData.cookies.splice(index, 1) // 將舊的cookie刪掉，透過下方展開運算符設定新的cookie及既有的cookie
            }
          })

          data.cookies = [...data.cookies, ...existDomainCookieData.cookies]
        }
      }
      // reactive 物件可能包含一些帶有方法和/或其他不可cloned屬性, 導致報錯"An object could not be cloned", 所以須要做以下處理
      const cookieData = JSON.parse(JSON.stringify(data))

      if (cookieString.slice(-1) === '=') { // 如果cookieString後面沒值，EX:SESSION=;，將此cookie從cookieData.cookies移除
        const findIndex = cookieData.cookies.findIndex(e => e.indexOf(cookieString) > -1)

        if (findIndex > -1) {
          cookieData.cookies.splice(findIndex, 1)
        }
      }

      if (!existDomainCookie) { // cookiesDB 沒資料時，將set-cookie資料新增至彈窗、currentTab-Header
        createCookiesDomain(cookieData)
      } else { // cookiesDB 有資料時，先判斷有無新增過，若無則將set-cookie資料新增至彈窗、currentTab-Header；有的話則更新
        updateCookiesDomain(cookieData)
      }
    }
  }
}

const obj = {
  url, cookiesDB, cookiesConfig, currentTabData, handleCookieFromResponse, findAndGenerateCookieString, extractCookieString
}

export default obj

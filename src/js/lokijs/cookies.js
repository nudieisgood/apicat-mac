import { app } from 'electron'

const path = app.getPath('userData')

const Loki = require('lokijs')
var db = new Loki(`${path}\\cookies.json`, { serializationMethod: 'pretty' })

let cookies = null
db.loadDatabase({}, () => {
  // 定義所有DB內的collections
  cookies = db.getCollection('cookies')
    ? db.getCollection('cookies')
    : db.addCollection('cookies', {
      clone: true,
      unique: 'domain'
    })
})

const save = () => {
  return new Promise(resolve => {
    db.saveDatabase(() => {
      resolve()
    })
  })
}

/**
 * 登出後刪除cookies資料
 */
const removeCookies = async () => {
  try {
    cookies.clear()
    await save()
  } catch (error) {
    console.log(error)
  }
}

/**
 * 欲新增的domain
 * @param {Object} arg - 新增的domain
 * @param {String} arg.domain - domain的名稱
 * @param {Array} arg.cookies - domain底下的所有cookies
 */
const createCookiesDomain = async (arg) => {
  try {
    cookies.insert({ domain: arg.domain, cookies: arg.cookies })
    await save()
  } catch (error) {
    console.log(error)
  }
}

/**
 * 欲更新的domain
 * @param {Object} arg - 更新的domain
 * @param {String} arg.domain - domain的名稱
 * @param {Array} arg.cookies - domain底下的所有cookies
 */
const updateCookiesDomain = async (arg) => {
  try {
    cookies.findAndUpdate({ domain: arg.domain }, (doc) => {
      doc.cookies = arg.cookies
    })
    await save()
  } catch (error) {
    console.log(error)
  }
}

/**
 * 取得所有的domain
 * @returns {Object} - 回傳所有的domain
 */
const getCookiesDomains = () => {
  return db.getCollection('cookies')
}

/**
 * 欲刪除的domain
 * @param {Object} arg - 刪除的domain
 * @param {String} arg.domain - domain的名稱
 */
const removeCookiesDomain = async (arg) => {
  try {
    cookies.findAndRemove({ domain: arg.domain })
    await save()
  } catch (error) {
    console.log(error)
  }
}

export {
  removeCookies, createCookiesDomain, updateCookiesDomain, getCookiesDomains, removeCookiesDomain
}

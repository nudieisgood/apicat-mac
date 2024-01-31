import { app } from 'electron'

const path = app.getPath('userData')

const Loki = require('lokijs')
var db = new Loki(`${path}\\user.json`, { serializationMethod: 'pretty' })

let user = null
db.loadDatabase({}, () => {
  // 定義所有DB內的collections
  user = db.getCollection('user')
    ? db.getCollection('user')
    : db.addCollection('user', {
      clone: true,
      unique: 'id'
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
 * 當前登入的使用者
 * @param {Object} arg - 使用者資料
 * @param {String} arg.id - 使用者的id
 * @param {String} arg.account - 使用者的帳號
 * @param {String} arg.userName - 使用者的名稱
 * @param {String} arg.token - 使用者的token
 * @param {String} arg.tokenAt - 使用者的token時間
 */
const createUser = async (arg) => {
  try {
    user.clear()
    user.insert({
      id: arg.id,
      account: arg.account,
      userName: arg.userName,
      token: arg.token,
      tokenAt: arg.tokenAt
    })
    await save()
  } catch (error) {
    console.log(error)
  }
}

/**
 * 取得當前登入的使用者資料
 */
const getUserInfo = () => {
  return db.getCollection('user')
}

/**
 * 登出後刪除使用者資料
 */
const removeUser = async () => {
  try {
    // db.removeCollection('user')
    user.clear()
    await save()
  } catch (error) {
    console.log(error)
  }
}

/**
 * 修改個人資料
 */
const updateUserInfo = async (arg) => {
  try {
    user.findAndUpdate({ id: arg.id }, (doc) => {
      doc.userName = arg.userName
    })
    await save()
  } catch (error) {
    console.log(error)
  }
}

export { createUser, getUserInfo, removeUser, updateUserInfo }

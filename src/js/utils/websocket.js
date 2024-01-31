/**
 * 處理接收 websocket 相關訊息
 * 1. 自動更新版本
 * 2. 邀請加入工作區
 */

import { ipcMain } from 'electron'
import autoUpdater from '@/js/utils/autoUpdater.js'
const WebSocket = require("ws")

// 自動更新版本

const initWebsocket = (userId) => {
  const parsedURL = new URL(process.env.VUE_APP_API_BASE);
  const domainName = parsedURL.host
  console.log('domainName__', domainName)
  const server = new WebSocket(`wss://${domainName}/websocket/${userId}`);
  server.on('open', (client) => {
    console.log('New client connected__')
    console.log('client__', client)
    // client.on('message', (message) => {
    //   // 接收來自 WebSocket 客戶端的訊息
    //   console.log('received: %s', message);
    //   // 在這裡可以做進一步的處理或將訊息發送給渲染進程
    // });
  })

  server.on('message', (message) => {
    // 從服務端收到的訊息
    const receivedData = JSON.parse(message)
    console.log('receivedData__', receivedData)
    const { event, data } = receivedData
    if (event === 'inviteParticipant') {
      // 邀請參與者通知
      global.mainWindow.webContents.send('invite-participant', data)
    } else if (event === 'updateVersion') {
      // 更新版本通知
      // global.mainWindow.webContents.send('update-version', data)
      autoUpdater.checkForUpdatesAndNotify();
      // ipcMain.send("check-for-updates");
    }
  })
  // 服務異常
  server.on("error", err => {
    console.error("服務異常:", err.message)
  })

  // 服務器關閉事件監聽
  server.on("close", () => {
    console.log("服務器關閉!")
  })

}


ipcMain.on('init-websocket', (event, arg) => {
  // 使用者登入後，註冊 websocket
  if (arg) initWebsocket(arg)
});

/**
 * 在渲染進程裡獲取更新資訊
 */
ipcMain.on("check-for-updates", (e, arg) => {
  console.log('可以更新唷')
  // global.mainWindow.webContents.send("update-downloaded");
  // autoUpdater.checkForUpdates();
});

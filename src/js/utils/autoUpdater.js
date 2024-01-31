import { app, ipcMain } from "electron";
const { autoUpdater } = require("electron-updater");
const path = require("path");
import logger from "@/js/utils/log.js";

// 在開發模式下使用 electron-updater 會出現 Skip checkForUpdates because application is not packed and dev update config is not forced，表示當前應用程式沒打包，跳過本次檢查更新，而每次修改程式碼重新打包測試較費時，先暫時修改當前狀態為已打包
Object.defineProperty(app, "isPackaged", {
  get() {
    return true;
  },
});
///////////////////
// Auto updater //
///////////////////

autoUpdater.requestHeaders = { "PRIVATE-TOKEN": "glpat-pBXDEcfdVFJq68mdz2CJ" };
autoUpdater.autoDownload = true;

autoUpdater.setFeedURL({
  provider: "generic",
  url: `https://git.wonder4studio.com/api/v4/projects/250/jobs/artifacts/develop/raw/dist?job=build`,
});

autoUpdater.on("checking-for-update", function () {
  sendStatusToWindow("Checking for update...");
});

autoUpdater.on("update-available", function (info) {
  sendStatusToWindow("Update available.");
});

autoUpdater.on("update-not-available", function (info) {
  sendStatusToWindow("Update not available.");
});

autoUpdater.on("error", function (err) {
  sendStatusToWindow("Error in auto-updater.");
});

autoUpdater.on("download-progress", function (progressObj) {
  console.log("progressObj__", progressObj);
  logger.info("progressObj__", progressObj);
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message =
    log_message + " - Downloaded " + parseInt(progressObj.percent) + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  sendStatusToWindow(log_message);
});

autoUpdater.on("update-downloaded", function (info) {
  sendStatusToWindow("Update downloaded; will install in 1 seconds");
});

autoUpdater.on("update-downloaded", function (info) {
  setTimeout(function () {
    autoUpdater.quitAndInstall();
  }, 1000);
});

// autoUpdater.checkForUpdates();

function sendStatusToWindow(message) {
  console.log(message);
  logger.info("message__", message);
}

console.log("__dirname__", __dirname);
// if (process.env.WEBPACK_DEV_SERVER_URL) {
//   // autoUpdater.updateConfigPath = path.join(__dirname, 'latest.yml')
// }

/**
 * 在渲染進程裡獲取更新資訊
 */

ipcMain.on("check-for-updates", (e, arg) => {
  console.log("有新版本可以更新唷");
  // global.mainWindow.webContents.send("update-downloaded");
  autoUpdater.checkForUpdates();
});

// autoUpdater.on("error", function (error) {
//   console.log('error')
//   console.log(error)
//   printUpdaterMessage('error');
//   global.mainWindow.webContents.send("updateError", error);
// });

// /**
//  * 開始檢查是否有更新
//  */

// autoUpdater.on("checking-for-update", function () {
//   printUpdaterMessage('checking');
// });

// // 3. 有更新時觸發
// autoUpdater.on("update-available", function (info) {
//   printUpdaterMessage('updateAvailable');
//   // 4. 告訴渲染進程有版本可以更新，info包含新版本訊息
//   global.mainWindow.webContents.send("update-available", info);
// });

// // 7. 收到確認更新提示，執行下載
// ipcMain.on('confirm-update', () => {
//   autoUpdater.downloadUpdate()
// })

// autoUpdater.on("update-not-available", function (info) {
//   printUpdaterMessage('updateNotAvailable');
// });

// // 下載進度，包含進度百分比、下載速度、已下載字節、總字節等
// autoUpdater.on("download-progress", function (progressObj) {
//   console.log('progressObj__', progressObj)
//   printUpdaterMessage('downloadProgress');
//   global.mainWindow.webContents.send("downloadProgress", progressObj);
// });

// // 下載完成，告訴畫面端，是否立即執行更新安裝操作
// autoUpdater.on("update-downloaded", function () {
//   global.mainWindow.webContents.send("update-downloaded");
//   // 12. 立即更新安装
//   ipcMain.on("restart-app", (e, arg) => {
//     autoUpdater.quitAndInstall();
//   });
// }
// );

// const printUpdaterMessage = (arg) => {
//   let message = {
//     error: '更新出錯',
//     checking: '正在檢查更新',
//     updateAvailable: '檢測到新版本',
//     downloadProgress: '下載中',
//     updateNotAvailable: '無新版本'
//   }
//   global.mainWindow.webContents.send("print-updater-message", message[arg]?arg: '');
// }

export default autoUpdater;

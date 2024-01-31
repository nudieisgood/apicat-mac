const {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  MenuItem,
  nativeImage,
  remote,
  dialog,
} = require("electron");
const path = require("path");
//
import { httpRequest, cancelHttpRequest } from "@/js/utils/httpRequest.js";
import {
  createCookiesDomain,
  updateCookiesDomain,
  getCookiesDomains,
  removeCookiesDomain,
} from "@/js/lokijs/cookies.js";
import {
  getTimestamp,
  getSingleTimestamp,
  setTabViewTS,
  deleteTabViewTS,
  getTabViewTS,
  activityWorkspace,
} from "@/js/lokijs/workspace.js";
import userApi from "@/js/api/userApi.js";
import collectionApi from "@/js/api/collectionApi.js";
import folderApi from "@/js/api/folderApi.js";
import itemApi from "@/js/api/itemApi.js";
import environmentApi from "@/js/api/environmentApi.js";
import workspaceApi from "@/js/api/workspaceApi.js";
import participantApi from "@/js/api/participantApi.js";
import helper from "@/js/utils/helper.js";
import recyclingBinApi from "@/js/api/recyclingBinApi.js";
import ws from "@/js/utils/websocket.js";
import autoUpdater from "@/js/utils/autoUpdater.js";
const WebSocket = require("ws");


// import * as dotenv from "dotenv";
// dotenv.config();

const log = require("electron-log");

const defaultPath = app.getPath("userData");
const envDataPath = `${defaultPath}_${process.env.VUE_APP_BRANCH}`;
app.setPath("userData", envDataPath);
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs/main.log");


//__static 是原專案套件 Vue CLI Plugin Electron Builder 提供的環境變數
// const iconPath = nativeImage.createFromPath(path.join(__static, "favicon.png"));
const iconPath = nativeImage.createFromPath(path.join(__dirname, "favicon.png"));

let tray;

const Store = require("electron-store");
const electronStore = new Store();

console.log('__main_process_print NODE_ENV', process.env.NODE_ENV);
console.log("__main_process_print VUE_APP_ENVIRONMENT_NAME", process.env.VUE_APP_ENVIRONMENT_NAME);
console.log("__main_process_print VUE_APP_API_BASE", process.env.VUE_APP_API_BASE);
console.log("__main_process_print VUE_APP_BRANCH", process.env.VUE_APP_BRANCH);
console.log("__MAIN_WINDOW_WEBPACK_ENTRY", MAIN_WINDOW_WEBPACK_ENTRY);

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']= 'true' // TEST 安全協定用 → 會無法執行 http request

app.whenReady().then(async () => {
  if (process.env.NODE_ENV !== "production") {
    try {
      const {
        default: installExtension,
      } = require("electron-devtools-installer");
      const vueDevtoolsBeta = {
        id: "nhdogjmejiglipccpnnnanhbledajbpd",
        electron: ">=1.2.1",
      };
      const result = await installExtension(vueDevtoolsBeta);
      if (result) {
        console.log("success load : " + result);
      }
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
});

const createWindow = async () => {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon:iconPath,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    minWidth: 600,
    minHeight: 700,
  });

  const lastWindowState = electronStore.get("windowState");
  if (lastWindowState) {
    global.mainWindow.setBounds(lastWindowState);
  }

  global.mainWindow.on("close", () => {
    // 讀取當下視窗大小並儲存
    const windowState = global.mainWindow.getBounds();
    electronStore.set("windowState", windowState);
  });

  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    // and load the index.html of the app.
    await global.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    // global.mainWindow.webContents.openDevTools();
    
  }


  setTray();
  await doActivity("auto");
  global.timeout = setInterval(async () => {
    await doActivity("auto");
  }, 1000 * 60 * 5);
  const fs = require("fs");
  const path = app.getPath("userData");
  fs.createWriteStream(`${path}\\util.log`, { flags: "w" });

  // 調整menu
  const appMenu = Menu.getApplicationMenu();
  const helpMenu = appMenu.items[appMenu.items.length - 1];
  helpMenu.submenu.append(
    new MenuItem({
      label: `Version: ${process.env.VUE_APP_VERSION}`,
    })
  );
  helpMenu.submenu.append(
    new MenuItem({
      label: `Environment: ${process.env.VUE_APP_ENVIRONMENT_NAME}`,
    })
  );
  // helpMenu.submenu.items[0].label = 'version: 123456'
  /*
  helpMenu.append(new MenuItem({
    label: 'version: 123456'
  })) */
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    // console.log('process.execPath__', process.execPath)
    // console.log('[path.resolve(process.argv[1])]__', [path.resolve(process.argv[1])])
    app.setAsDefaultProtocolClient("okman", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("okman");
}

app.on("open-url", async function (event, url) {
  event.preventDefault();
  global.deeplinkingUrl = url;
  if (global.deeplinkingUrl) {
    const getWorkspaceListRes = await workspaceApi.getWorkspaceList();
    const res = await selectWorkspace(getWorkspaceListRes);
    global.workspaceId = res;
    if (global.workspaceId) {
      const urlArray = global.deeplinkingUrl
        .replace(/OKMan:\/\//gi, "")
        .replace(/\//gi, "")
        .replace(/workspaceId=/gi, "")
        .replace(/id=/gi, "")
        .split("&");
      global.collectionsId = urlArray[0];
      global.originalWorkspaceId = urlArray[1];
      const data = {
        workspaceId: global.workspaceId,
        collectionsId: global.collectionsId,
        originalWorkspaceId: global.originalWorkspaceId,
      };
      const importCollectionRes = await collectionApi.importCollectionById(
        data
      );
      if (importCollectionRes.code === 20000) {
        await doActivity();
      }
    }
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on("second-instance", async (e, argv) => {
    if (process.platform !== "darwin") {
      global.deeplinkingUrl = argv.find((arg) => arg.startsWith("okman://"));
    }
    if (global.mainWindow) {
      if (global.mainWindow.isMinimized()) global.mainWindow.restore();
      global.mainWindow.focus();
    }

    // url like: join-workspace?declined=true&inviteCode=0d968cf1-10cf-41a0-b200-58e41ecb8501

    if (global.deeplinkingUrl) {
      const url = global.deeplinkingUrl
        .replace(/OKMan:\/\//gi, "")
        .replace(/\//gi, "");
      const reg = /^[^?]+/;
      const match = url.match(reg);
      let matchResult = "";
      if (match) matchResult = match[0];

      if (matchResult === "join-workspace") {
        // 處理是否參加工作區
        handleJoinWorkspace(url);
      } else {
        const getWorkspaceListRes = await workspaceApi.getWorkspaceList();
        const res = await selectWorkspace(getWorkspaceListRes);
        global.workspaceId = res;
        if (global.workspaceId) {
          const urlArray = global.deeplinkingUrl
            .replace(/OKMan:\/\//gi, "")
            .replace(/\//gi, "")
            .replace(/workspaceId=/gi, "")
            .replace(/id=/gi, "")
            .split("&");
          global.collectionsId = urlArray[0];
          global.originalWorkspaceId = urlArray[1];
          const data = {
            workspaceId: global.workspaceId,
            collectionsId: global.collectionsId,
            originalWorkspaceId: global.originalWorkspaceId,
          };
          const importCollectionRes = await collectionApi.importCollectionById(
            data
          );
          if (importCollectionRes.code === 20000) {
            await doActivity();
          }
        }
      }

      // if (invalidInviteLink) {
      //   dialog.showMessageBox({
      //     type: 'info',
      //     title: 'Warning',
      //     detail: '無效的邀請連結'
      //   })
      // }
    }
  });

  // const timeId = setInterval(() => { sendSecondInstance() }, 3000)
  // const sendSecondInstance = () => {
  //   if (app.isReady()) {
  //     app.emit('second-instance', null, process.argv)
  //     clearInterval(timeId)
  //   }
  // }

  const sendSecondInstance = () => {
    return new Promise((resolve, reject) => {
      setInterval(() => {
        if (app.isReady()) {
          resolve(app.isReady());
        }
      }, 3000);
    });
  };

  (async () => {
    const res = await sendSecondInstance();
    if (res) app.emit("second-instance", null, process.argv);
  })();

  // app.emit('second-instance', null, process.argv)
}

const selectWorkspace = (getWorkspaceListRes) => {
  return new Promise((resolve, reject) => {
    global.mainWindow.webContents.send(
      "select-workspace",
      handleWorkspaceList(getWorkspaceListRes.data)
    );
    ipcMain.once("select-workspace-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

const handleWorkspaceList = (list) => {
  return list.map(({ workspaceId, name }) => {
    return { value: workspaceId, label: name };
  });
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("mainWindow:close", () => {
  global.mainWindow.hide();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// 處理非同步出現的 Unhandled Rejection
process.on("unhandledRejection", (err, origin) => {
  console.log("unhandledRejection");
  console.log(err, origin);
  handleUncaughtExceptionOrRejection("unhandledRejection", err, origin);
});
// 處理同步出現的 Uncaught Exception
process.on("uncaughtException", (err, origin) => {
  console.log("uncaughtException");
  console.log(err, origin);
  handleUncaughtExceptionOrRejection("uncaughtException", err, origin);
});
const handleUncaughtExceptionOrRejection = (event, err, origin) => {
  console.log("handleUncaughtExceptionOrRejection__");
  console.log(event, err, origin);
  helper.errorLogToFile(event, err, origin);
};

function setTray() {
  //先註解
  tray = new Tray(iconPath.resize({ width: 16, height: 16 }));
  //先註解
  //先註解
  tray.setToolTip("Tasky");
  //先註解
  tray.on("click", () => {
    if (global.mainWindow.isVisible()) {
      global.mainWindow.hide();
    } else {
      global.mainWindow.show();
    }
  });
  tray.on("right-click", () => {
    const menuConfig = Menu.buildFromTemplate([
      {
        label: "Quit",
        click: () => app.quit(),
      },
    ]);
    tray.popUpContextMenu(menuConfig);
  });
}

const wrapIpcCallback = (eventName, callback) => {
  ipcMain.on(eventName, async (event, arg) => {
    helper.logToFile("IpcMain Receive", eventName, JSON.stringify(arg));
    try {
      const res = await callback(event, arg);
      helper.logToFile("IpcMain SendBack", eventName, JSON.stringify(arg));
      event.reply(eventName + "-cb", res);
    } catch (error) {
      event.reply(eventName + "-cb", error);
    }
  });
};

/**
 * 發送 http 請求
 */
ipcMain.on("ipc-http-request", async (event, arg) => {
  helper.logToFile("IpcMain Receive", "ipc-http-request", JSON.stringify(arg));
  await httpRequest(arg, function (params) {
    let uniqueName = `http-request-${params.requestId}`;
    event.reply(uniqueName, params);
    // event.reply('ipc-http-request-cb', params)
    helper.logToFile("IpcMain SendBack", "ipc-http-request-cb", params);
  });
});

/**
 * 取消發送 http 請求
 */

ipcMain.on("cancel-request", async (event, arg) => {
  await cancelHttpRequest(arg);
});

/**
 * pre-request 和 test-script 事件處理
 */
let omScriptEvent = false;

ipcMain.on("om-script-event-start", (event, arg) => {
  omScriptEvent = true;
});

ipcMain.on("om-script-event-end", (event, arg) => {
  omScriptEvent = false;
});

// cookies
/**
 * 在 cookies DB 新增一個 domain
 */
ipcMain.on("create-cookies-domain", (event, arg) => {
  createCookiesDomain(arg);
  const data = getCookiesDomains().data;
  event.reply("create-cookies-domain-cb", data);
});

/**
 * 編輯指定 domain 的 cookies
 */
ipcMain.on("update-cookies-domain", (event, arg) => {
  updateCookiesDomain(arg);
  const data = getCookiesDomains().data;
  event.reply("update-cookies-domain-cb", data);
});

/**
 * 獲取存在於 cookies DB 裡所有的 domain
 */
ipcMain.on("get-cookies-domains", (event, arg) => {
  const data = getCookiesDomains().data;
  event.reply("get-cookies-domains-cb", data);
});

/**
 * 刪除指定的 domain
 */
ipcMain.on("remove-cookies-domain", (event, arg) => {
  removeCookiesDomain(arg);
  const data = getCookiesDomains().data;
  event.reply("remove-cookies-domain-cb", data);
});

// user
/**
 * 註冊
 */
wrapIpcCallback("ipc-register-request", async (event, arg) => {
  return await userApi.register(arg);
});

/**
 * 登入
 */
wrapIpcCallback("ipc-login-request", async (event, arg) => {
  const res = await userApi.login(arg);
  // 有可能跨裝置做其它資料操作，登入時先同步一次
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 登出
 */
wrapIpcCallback("ipc-logout-request", async (event) => {
  return await userApi.logout();
});

/**
 * 取得當前使用者帳戶
 */
wrapIpcCallback("get-user-information", (event) => {
  return userApi.getUserInformation();
});

/**
 * 修改個人資料
 */
wrapIpcCallback("update-user-info", async (event, arg) => {
  return await userApi.updateUserInformation(arg);
});

/**
 * 變更密碼
 */
wrapIpcCallback("update-user-password", async (event, arg) => {
  return await userApi.updateUserPassword(arg);
});

/**
 * Register 重新發送認證信件
 */
wrapIpcCallback("resend-confirm-email", async (event, arg) => {
  // console.log('wrapIpcCallback__', arg)
  return await userApi.resendConfirmEmail(arg);
});

/**
 * 發出忘記密碼OTP信件
 */
wrapIpcCallback("send-otp", async (event, arg) => {
  return await userApi.sendOTP(arg);
});

/**
 * 忘記密碼重設密碼
 */
wrapIpcCallback("reset-password", async (event, arg) => {
  return await userApi.resetPassword(arg);
});

const doActivity = async (type) => {
  const timestamp = getTimestamp();
  // console.log('doActivity timestamp__', timestamp)
  if (timestamp.length) {
    const allTasks = [];
    timestamp.forEach((item) => {
      const task = async () => {
        try {
          const res = await workspaceApi.getActivityList(item);
          if (res.code === 20000) {
            await activityWorkspace(res.data, type);
          }
        } catch (error) {
          console.log(error);
        }
      };
      allTasks.push(task());
    });
    await Promise.all(allTasks);
    global.mainWindow.webContents.send("reload", global.workspaceId);
  } else {
    // NOTE: 20231206
  }
};

// participant
/**
 * 取得工作區參與者
 */
wrapIpcCallback("get-participant", async (event, arg) => {
  return await participantApi.getParticipant(arg);
});

/**
 * 工作區參與邀請連結
 */
wrapIpcCallback("participant-confirm", async (event, arg) => {
  return await participantApi.participantConfirm(arg);
});

/**
 * 邀請參與者
 */
wrapIpcCallback("invite-participant", async (event, arg) => {
  return await participantApi.inviteParticipant(arg);
});

/**
 * 編輯參與者權限
 */
wrapIpcCallback("edit-participant", async (event, arg) => {
  return await participantApi.editParticipant(arg);
});

/**
 * 踢除參與者
 */
wrapIpcCallback("remove-participant", async (event, arg) => {
  return await participantApi.removeParticipant(arg);
});

/**
 * 參與者自行退出工作區
 */
wrapIpcCallback("leave-workspace", async (event, arg) => {
  return await participantApi.leaveWorkspace(arg);
});

const overwriteEvent = (arg) => {
  const data = {
    activityType: "",
    actionType: "",
  };
  switch (arg.activityType) {
    case 0:
      data.activityType = "Workspace";
      break;
    case 1:
      data.activityType = "Collections";
      break;
    case 2:
      data.activityType = "Folder";
      break;
    case 3:
      data.activityType = "Items";
      break;
    case 4:
      data.activityType = "Environment";
      break;
    default:
      break;
  }
  switch (arg.actionType) {
    case 0:
      data.actionType = "新增";
      break;
    case 1:
      data.actionType = "編輯";
      break;
    case 2:
      data.actionType = "刪除";
      break;
    case 3:
      data.actionType = "移動";
      break;
    default:
      break;
  }

  return new Promise((resolve, reject) => {
    global.mainWindow.webContents.send("overwite-event", data);
    ipcMain.once("overwite-event-cb", (event, arg) => {
      resolve(arg);
    });
  });
};

// workspace
/**
 * 新增workspace
 */
wrapIpcCallback("create-workspace", async (event, arg) => {
  return await workspaceApi.createWorkspace(arg);
});

/**
 * 編輯workspace
 */
wrapIpcCallback("edit-workspace", async (event, arg) => {
  if (omScriptEvent) {
    const res = await workspaceApi.editWorkspace(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  if (ts) {
    const list = await workspaceApi.getActivityList({
      workspaceId: arg.workspaceId,
      targetId: arg.workspaceId,
      timestamp: ts.timestamp,
    });
    if (!list.data.length) {
      const res = await workspaceApi.editWorkspace(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
      if (overwriteCb) {
        const res = await workspaceApi.editWorkspace(arg);
        if (res.code === 20000) {
          await doActivity();
          return res;
        } else {
          return res;
        }
      } else {
        await doActivity();
      }
    }
  } else {
    const res = await workspaceApi.editWorkspace(arg);
    return res;
  }
});

/**
 * 刪除workspace
 */
wrapIpcCallback("delete-workspace", async (event, arg) => {
  if (omScriptEvent) {
    const res = await workspaceApi.deleteWorkspace(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  if (ts) {
    const list = await workspaceApi.getActivityList({
      workspaceId: arg.workspaceId,
      targetId: arg.workspaceId,
      timestamp: ts.timestamp,
    });
    if (!list.data.length) {
      const res = await workspaceApi.deleteWorkspace(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
      if (overwriteCb) {
        const res = await workspaceApi.deleteWorkspace(arg);
        if (res.code === 20000) {
          await doActivity();
          return res;
        } else {
          return res;
        }
      } else {
        await doActivity();
      }
    }
  } else {
    const res = await workspaceApi.deleteWorkspace(arg);
    return res;
  }
});

/**
 * 取得workspace json tree
 */
wrapIpcCallback("get-workspace-tree", async (event, arg) => {
  global.workspaceId = arg.workspaceId;
  const res = await workspaceApi.getWorkspaceTree(arg);
  return res;
});

/**
 * 取得workspace清單
 */
wrapIpcCallback("get-workspace-list", async (event) => {
  return await workspaceApi.getWorkspaceList();
});

/**
 * 根據id取得workspace
 */
wrapIpcCallback("get-workspace", async (event, arg) => {
  return await workspaceApi.getWorkspace(arg);
});

/**
 * 取得該workspace完整活動紀錄(不含history內容)
 */
wrapIpcCallback("get-workspace-activity", async (event, arg) => {
  return await workspaceApi.getWorkspaceActivity(arg);
});

/**
 * 手動同步
 */
wrapIpcCallback("manual-do-activity", (event) => {
  doActivity();
  return true;
});

wrapIpcCallback("edit-workspace-owner", async (event, arg) => {
  return await workspaceApi.editWorkspaceOwner(arg);
});

// collection
/**
 * 新增collection
 */
wrapIpcCallback("create-collection", async (event, arg) => {
  const res = await collectionApi.createCollection(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 複製collection
 */
wrapIpcCallback("copy-collection", async (event, arg) => {
  const res = await collectionApi.importCollectionById(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 編輯collection
 */
wrapIpcCallback("edit-collection", async (event, arg) => {
  if (omScriptEvent) {
    const res = await collectionApi.editCollection(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }
  const ts = getTabViewTS(arg.collectionsId)
    ? getTabViewTS(arg.collectionsId)
    : getSingleTimestamp(arg.workspaceId);
  // if (ts) {
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.collectionsId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await collectionApi.editCollection(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await collectionApi.editCollection(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
  // } else {
  //   const res = await collectionApi.editCollection(arg)
  //   return res
  // }
});

/**
 * 刪除collection
 */
wrapIpcCallback("delete-collection", async (event, arg) => {
  if (omScriptEvent) {
    const res = await collectionApi.deleteCollection(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  // if (ts) {
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.collectionsId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await collectionApi.deleteCollection(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await collectionApi.deleteCollection(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
  // } else {
  //   const res = await collectionApi.deleteCollection(arg)
  //   return res
  // }
});

/**
 * 匯入Collection
 */
wrapIpcCallback("import-collection", async (event, arg) => {
  const res = await collectionApi.importCollection(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 匯出Collection
 */
wrapIpcCallback("export-collection", async (event, arg) => {
  const res = await collectionApi.exportCollection(arg);
  await helper.downloadJsonFile(res);
  return res;
});

/**
 * 輸出至API文件
 */
wrapIpcCallback("download-html-file", async (event, arg) => {
  const res = await collectionApi.exportCollection(arg);
  await helper.downloadHtmlFile(res);
  return res;
});

// folder
/**
 * 新增folder
 */
wrapIpcCallback("create-folder", async (event, arg) => {
  const res = await folderApi.createFolder(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

// folder
/**
 * 複製folder
 */
wrapIpcCallback("copy-folder", async (event, arg) => {
  const res = await collectionApi.importCollectionById(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 編輯folder
 */
wrapIpcCallback("edit-folder", async (event, arg) => {
  if (omScriptEvent) {
    const res = await folderApi.editFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getTabViewTS(arg.folderId)
    ? getTabViewTS(arg.folderId)
    : getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.folderId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await folderApi.editFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await folderApi.editFolder(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

/**
 * 移動folder
 */
wrapIpcCallback("move-folder", async (event, arg) => {
  if (omScriptEvent) {
    const res = await folderApi.moveFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.folderId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await folderApi.moveFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await folderApi.moveFolder(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

/**
 * 刪除folder
 */
wrapIpcCallback("delete-folder", async (event, arg) => {
  if (omScriptEvent) {
    const res = await folderApi.deleteFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.folderId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await folderApi.deleteFolder(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await folderApi.deleteFolder(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

// item
/**
 * 新增item
 */
wrapIpcCallback("create-item", async (event, arg) => {
  const res = await itemApi.createItem(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 複製Item
 */
wrapIpcCallback("copy-item", async (event, arg) => {
  const res = await collectionApi.importCollectionById(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 編輯item
 */
wrapIpcCallback("edit-item", async (event, arg) => {
  if (omScriptEvent) {
    const res = await itemApi.editItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getTabViewTS(arg.itemsId)
    ? getTabViewTS(arg.itemsId)
    : getSingleTimestamp(arg.workspaceId);
  // if (ts) {
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.itemsId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await itemApi.editItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await itemApi.editItem(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
  // } else {
  //   const res = await itemApi.editItem(arg)
  //   return res
  // }
});

/**
 * 移動item
 */
wrapIpcCallback("move-item", async (event, arg) => {
  if (omScriptEvent) {
    const res = await itemApi.moveItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.itemsId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await itemApi.moveItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await itemApi.moveItem(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

/**
 * 刪除item
 */
wrapIpcCallback("delete-item", async (event, arg) => {
  if (omScriptEvent) {
    const res = await itemApi.deleteItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.itemsId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await itemApi.deleteItem(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await itemApi.deleteItem(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

/**
 * 開啟一個tab view
 */
wrapIpcCallback("open-tab-view", async (event, arg) => {
  await setTabViewTS(arg.workspaceId, arg.id);
  return true;
});

/**
 * 關閉一個tab view
 */
wrapIpcCallback("close-tab-view", async (event, arg) => {
  await deleteTabViewTS(arg.id);
  return true;
});

// environment
/**
 * 新增environment
 */
wrapIpcCallback("create-environment", async (event, arg) => {
  const res = await environmentApi.createEnvironmentApi(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 編輯environment
 */
wrapIpcCallback("edit-environment", async (event, arg) => {
  if (omScriptEvent) {
    const res = await environmentApi.editEnvironmentApi(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getTabViewTS(arg.environmentId)
    ? getTabViewTS(arg.environmentId)
    : getSingleTimestamp(arg.workspaceId);
  // if (ts) {
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.environmentId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await environmentApi.editEnvironmentApi(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await environmentApi.editEnvironmentApi(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
  // } else {
  //   const res = await environmentApi.editEnvironmentApi(arg)
  //   return res
  // }
});

/**
 * 刪除environment
 */
wrapIpcCallback("delete-environment", async (event, arg) => {
  if (omScriptEvent) {
    const res = await environmentApi.deleteEnvironmentApi(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  }

  const ts = getSingleTimestamp(arg.workspaceId);
  const list = await workspaceApi.getActivityList({
    workspaceId: arg.workspaceId,
    targetId: arg.environmentId,
    timestamp: ts.timestamp,
  });
  if (!list.data.length) {
    const res = await environmentApi.deleteEnvironmentApi(arg);
    if (res.code === 20000) {
      await doActivity();
      return res;
    } else {
      return res;
    }
  } else {
    const overwriteCb = await overwriteEvent(list.data.reverse()[0]);
    if (overwriteCb) {
      const res = await environmentApi.deleteEnvironmentApi(arg);
      if (res.code === 20000) {
        await doActivity();
        return res;
      } else {
        return res;
      }
    } else {
      await doActivity();
    }
  }
});

// 匯入json檔時，要重新取得該檔案路徑
ipcMain.on("save-temp-file", async (event, arg) => {
  try {
    const result = await helper.saveTempFile(arg);
    event.reply("save-temp-file-cb", result);
    // return result
  } catch (error) {
    console.error(error);
  }
});

// 匯入json成功或失敗時，要將暫時存的檔案刪掉
ipcMain.on("delete-temp-file", async (event, arg) => {
  const fs = require("fs");
  try {
    fs.unlink(arg, (err) => {
      if (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

let invalidInviteLink = false;

const handleJoinWorkspace = async (url) => {
  invalidInviteLink = false;
  const queryMatch = url.match(/\?(.*)/);
  if (queryMatch) {
    const queryString = queryMatch[1];
    const queryParameters = {};
    // 將 query 字符串轉換為物件
    queryString.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      if (key === "declined") {
        queryParameters[key] = JSON.parse(value);
      } else {
        queryParameters[key] = value;
      }
    });

    const res = await participantApi.participantConfirm(queryParameters);
    if (res.code === 20000) {
      await doActivity(); // 僅會更新當前 workspace 資料
      global.mainWindow.webContents.send("update-workspace-list"); // 確認加入後，須更新 workspace 列表
    } else {
      invalidInviteLink = true;
      global.mainWindow.webContents.send("show-message", {
        type: "warn",
        message: res.message,
      });
    }
  }
};

ipcMain.on("log", (event, level, message) => {
  log[level](message);
});

ipcMain.on("read-log-file", async (event, arg) => {
  try {
    const result = await helper.readLogFile();
    event.reply("read-log-file-cb", result);
    // return result
  } catch (error) {
    console.error(error);
  }
});

// 沒有透過logout API而被自動導入登入頁時，需清除DB資料
wrapIpcCallback("auto-logout", (event, arg) => {
  return userApi.autoLogout();
});

ipcMain.on("renderer-log", (event, arg) => {
  // console.log('renderer-log arg__', arg)
  if (!arg || !arg.msg) return;
});

ipcMain.on("test-download", (event, arg) => {
  // console.log('test-download arg__', arg)
  helper.testDownload(arg);
  // console.log('renderer-log arg__', arg)
});

// 监听渲染进程请求获取日志的事件
ipcMain.on("get-log", async (event) => {
  // 读取日志文件的内容
  try {
    const result = await helper.readLogFile();
    event.reply("log-content", result);
    // return result
  } catch (error) {
    console.error(error);
  }
});

/**
 * 取得垃圾桶資料
 */
wrapIpcCallback("get-recycling-bin-list", async (event) => {
  return await recyclingBinApi.getRecyclingBinList();
});

/**
 * 復原垃圾桶資料
 */
wrapIpcCallback("restore-recycling-bin-data", async (event, arg) => {
  // return await recyclingBinApi.restoreRecyclingBinData(arg)
  const res = await recyclingBinApi.restoreRecyclingBinData(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * 手動刪除垃圾桶資料(單筆或多筆)
 */

wrapIpcCallback("delete-recycling-bin-data", async (event, arg) => {
  const res = await recyclingBinApi.deleteRecyclingBinData(arg);
  if (res.code === 20000) {
    await doActivity();
    return res;
  } else {
    return res;
  }
});

/**
 * download response file
 */
wrapIpcCallback("download-response-file", async (event, arg) => {
  const res = await helper.downloadResponseFile(arg);
  // const res = await helper.downloadResponseFile(arg)
  global.mainWindow.webContents.send("show-message", {
    type: res.type,
    message: res.message,
  });
});

const initWebsocket = (userId) => {
  const parsedURL = new URL(process.env.VUE_APP_API_BASE);
  const domainName = parsedURL.host;
  console.log("domainName__", domainName);
  const server = new WebSocket(`wss://${domainName}/websocket/${userId}`);
  server.on("open", (client) => {
    console.log("New client connected__");
    console.log("client__", client);
    // client.on('message', (message) => {
    //   // 接收來自 WebSocket 客戶端的訊息
    //   console.log('received: %s', message);
    //   // 在這裡可以做進一步的處理或將訊息發送給渲染進程
    // });
  });

  server.on("message", (message) => {
    // 從服務端收到的訊息
    const receivedData = JSON.parse(message);
    console.log("receivedData__", receivedData);
    const { event, data } = receivedData;
    if (event === "inviteParticipant") {
      // 邀請參與者通知
      global.mainWindow.webContents.send("invite-participant", data);
    } else if (event === "updateVersion") {
      // 更新版本通知
    }
  });

  // 服務異常
  server.on("error", (err) => {
    console.error("服務異常:", err.message);
  });

  // 服務器關閉事件監聽
  server.on("close", () => {
    console.log("服務器關閉!");
  });
};

ipcMain.on("init-websocket", (event, arg) => {
  // 使用者登入時，註冊 websocket
  if (arg) initWebsocket(arg);
});

class Helper {
  static apiRequestData(params) {
    const arg = {};
    for (const key in params) {
      if (params[key] !== undefined) {
        arg[key] = params[key];
      }
    }
    return arg;
  }

  static logToFile(phrase, event, arg) {
    const { app } = require("electron");
    const fs = require("fs");
    const path = app.getPath("userData");
    const date = new Date();

    const body = Helper.stringify(arg);
    fs.appendFile(
      `${path}\\util.log`,
      `[${phrase} ${date
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "")
        .replace(/-/gi, "/")}]: [${event}],[${body}]` + "\n",
      (error) => {
        if (error) {
          console.log(error);
        }
      }
    );
  }

  static errorLogToFile(event, e, origin) {
    const { app } = require("electron");
    const fs = require("fs");
    const path = app.getPath("userData");
    const date = new Date();

    fs.appendFile(
      `${path}\\error.log`,
      `[${event} ${date
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "")
        .replace(/-/gi, "/")}]: [${origin}],[${e}]` + "\n",
      (error) => {
        if (error) {
          console.log(error);
        }
      }
    );
  }

  static stringify(obj) {
    if (obj === null || obj === undefined) {
      return "";
    }

    const type = obj.constructor.name;

    try {
      if (type === "FormData") {
        // const json = {}
        // const iter = obj.keys()
        // for (const key of iter) {
        //   json[key] = obj.get(key)
        // }
        return obj.getBuffer().toString();
      } else if (type === "Object") {
        return JSON.stringify(obj);
      } else if (type === "String") {
        return obj;
      } else if (type === "Array") {
        let str = "";

        for (let i = 0; i < obj.length; i++) {
          str += Helper.stringify(obj[i]) + ",";
        }

        return str;
      }
    } catch (ex) {
      console.log("error", ex);
    }
  }

  static generateHashKey(length) {
    let hash = "";

    for (let i = 0; i < length; i++) {
      hash += String.fromCharCode(97 + parseInt(Math.random() * 25));
    }

    return hash;
    // return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36)
  }

  static downloadJsonFile(res) {
    const { dialog } = require("electron");
    const fs = require("fs");
    dialog
      .showSaveDialog({
        defaultPath: `${JSON.parse(res).name}.json`,
        filters: [
          {
            name: "Json Files",
            extensions: ["json"],
          },
        ],
      })
      .then((file) => {
        if (!file.canceled) {
          fs.writeFile(file.filePath.toString(), res, (error) => {
            if (error) throw error;
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  static downloadHtmlFile(res) {
    try {
      const { dialog } = require("electron");
      const fs = require("fs");
      const path = require("path");
      // eslint-disable-next-line no-undef
      const htmlPath = path.join(__static, "template.html");
      fs.readFile(htmlPath, "utf8", (err, data) => {
        if (err) throw err;

        let htmlData = data;
        const rep = /const jsonfile = reactive\(\{\}\)/gi;
        htmlData = htmlData.replace(rep, `const jsonfile = reactive(${res})`);
        dialog
          .showSaveDialog({
            defaultPath: `${JSON.parse(res).name}.html`,
            filters: [
              {
                name: "HTML Files",
                extensions: ["html"],
              },
            ],
          })
          .then((file) => {
            if (!file.canceled) {
              fs.writeFile(file.filePath.toString(), htmlData, (error) => {
                if (error) throw error;
              });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } catch (error) {
      console.log("error", error);
    }
  }

  static throttle(func, timeout = 500) {
    let timer;
    return (...args) => {
      if (!timer) {
        func.apply(this, args);
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
      }, timeout);
    };
  }

  // 計算dom是否在選取範圍內
  static domInRange(rect1, rect2) {
    if (!rect1) {
      return;
    }
    const maxX = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const maxY = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);
    const minX = Math.min(rect1.x, rect2.x);
    const minY = Math.min(rect1.y, rect2.y);
    if (
      maxX - minX <= rect1.width + rect2.width &&
      maxY - minY <= rect1.height + rect2.height
    ) {
      return true;
    } else {
      return false;
    }
  }

  static isJsonString(str) {
    try {
      if (typeof JSON.parse(str) === "object") {
        return true;
      }
    } catch (e) {}
    return false;
  }

  // 匯入json檔時，若該檔案有做調整，需重新取得路徑
  /**
   * @param file  已透過reader.readAsText的file內容
   *
   */
  static async saveTempFile(file) {
    const { app } = require("electron");
    const fs = require("fs");

    const dirPath = app.getPath("userData");
    const path = require("path");

    const saveFile = (file) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(dirPath, "tempFile.json");
        fs.writeFile(filePath, file, (err) => {
          if (err) {
            // console.error('儲存檔案時發生錯誤：', err)
            reject(err);
            return;
          }
          // console.log('檔案已成功儲存。')
          resolve(filePath);
        });
      });
    };

    const filePath = await saveFile(file);
    return filePath;
  }

  /**
   * @param header 帶入http header
   * 取得response content-type，用於判斷response editor 要顯示什麼language
   */
  static getContentType(headers) {
    const contentType = headers["content-type"] || headers["Content-Type"];

    if (!contentType) return undefined;

    // return contentType
    return contentType.split(";")[0];
  }

  static debounce(func, delay = 10) {
    let timeout = null;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(this, args);
      }, delay);
    };
  }

  static async debugLogToFile(phrase, event, arg, bodyData, response) {
    // const electron = require("electron")
    // const { ipcRenderer } = electron;

    const { app, ipcMain } = require("electron");
    // console.log('ipcRenderer__', ipcMain)
    const fs = require("fs");
    const path = app.getPath("userData");

    const logContent = Helper.handleLogContent(event, arg, bodyData, response);
    let str = `${logContent.contentTitle} \n` + `${logContent.content}`;

    fs.appendFile(`${path}\\logs\\main.log`, `${str}` + "\n", (error) => {
      if (error) {
        console.log(error);
      } else {
        // Helper.readLogFile()
      }
    });
  }

  static readLogFile() {
    const { app } = require("electron");
    const fs = require("fs");
    // const path = require('path')
    const path = app.getPath("userData");
    const logPath = `${path}\\logs\\main.log`;

    const readFile = (path) => {
      return new Promise((resolve, reject) => {
        fs.readFile(path, "utf8", (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
      });
    };

    const result = readFile(logPath);
    return result;
  }

  static handleLogContent(event, arg, bodyData, response) {
    // console.log('handleLogContent')

    let contentTitle = `${arg.method} ${arg.url}`;
    let content = `${response.request._header} \n`;

    content += `${Helper.stringify(bodyData._streams)} \n`;
    for (const key in response.headers) {
      content += `${key}:${response.headers[key]} \n`;
    }
    content += `\n ${Helper.stringify(response.data)}`;
    return { contentTitle, content };
  }

  static async testDownload(file) {
    const { app } = require("electron");
    const fs = require("fs");

    const dirPath = app.getPath("userData");
    const path = require("path");

    const saveFile = (file) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(dirPath, "tempFile.bmp");
        fs.writeFile(filePath, file, (err) => {
          if (err) {
            console.error("儲存檔案時發生錯誤：", err);
            reject(err);
            return;
          }
          console.log("檔案已成功儲存。");
          resolve(filePath);
        });
      });
    };

    const filePath = await saveFile(file);
    return filePath;
  }

  static getLogContent() {
    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    // 发送请求获取日志的事件给主进程
    ipcRenderer.send("get-log");
    // ipcRenderer.once("log-content", (event, logContent) => {
    //   // 在这里处理日志内容，可以将其显示在渲染进程的界面上
    //   console.log("Log Content:", logContent);
    // });
  }

  /**
   * @param header 帶入http header
   * 取得附件檔案名稱
   */
  static getFileName(headers) {
    const contentDisposition = headers["content-disposition"];
    if (!contentDisposition) return undefined;
    const matches = contentDisposition.match(/filename="(.*)"/);
    if (!matches) return undefined;
    const fileName = decodeURI(matches[1]);

    return fileName;
  }
  /**
   * 下載 response file
   */
  static downloadResponseFile(res) {
    // console.log('downloadResponseFile__', res)
    const bufferData = Buffer.from(res.fileStream);
    return new Promise((resolve, reject) => {
      const { dialog } = require("electron");
      const fs = require("fs");
      dialog
        .showSaveDialog({
          defaultPath: `${res.fileName}`,
        })
        .then((file) => {
          if (!file.canceled) {
            fs.writeFile(file.filePath.toString(), bufferData, (error) => {
              if (error) {
                reject({ type: "warn", message: "Downloaded response fail" });
              } else {
                resolve({
                  type: "success",
                  message: "Downloaded response successfully",
                });
              }
            });
          } else {
            reject({ type: "warn", message: "Download canceled" });
          }
        })
        .catch((error) => {
          console.log(error);
          reject({ type: "error", message: error.message });
        });
    });
  }

  static initElementIdByIndex(arr, type) {
    if (arr.length > 0) {
      arr.forEach((row, index) => {
        row.id = `${type}-${index}`;
      });
    }
    return arr;
  }

  /**
   * 信箱驗證
   *
   */
  static emailVerify(email) {
    const regex =
      "^\\w{1,63}@[a-zA-Z0-9]{2,63}\\.[a-zA-Z]{2,63}(\\.[a-zA-Z]{2,63})?$";
    const reg = new RegExp(regex);
    return reg.test(email);
  }
}

export default Helper;

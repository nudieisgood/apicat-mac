const electron = window.require('electron')
const { ipcRenderer } = electron

const channel = 'renderer-log'

/**
 * info log
 * @param {*} msg
 */
const infoLog = (msg) => {
  ipcRenderer.send(channel, {msg: msg, type: 'info'})
}

/**
 * warn log
 * @param {*} msg
 */
const warnLog = (msg) => {
  ipcRenderer.send(channel, {msg: msg, type: 'warn'})
}

/**
 * error log
 * @param {*} msg
 */

const errorLog = (msg) => {
  ipcRenderer.send(channel, {msg: msg, type: 'error'})
}

export { infoLog, warnLog, errorLog }

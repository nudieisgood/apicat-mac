import modal from 'ant-design-vue/es/modal'
import logData from '@/store/logData'
import store from '@/store'

const electron = window.require('electron')
const { ipcRenderer } = electron

const ipcHttpRequest = async(arg, isReturnResponseData) => {
  store.commit("RESET_RESPONSE_DATA");
  let uniqueName = `http-request-${arg.id}`
  ipcRenderer.send('ipc-http-request', arg)

  return new Promise(resolve => {
    ipcRenderer.once(uniqueName, (event, params) => {
      // 這裡的 params 是從主進程中返回的值
      // console.log('Received params from main process:', params);
      if (isReturnResponseData) { // 用於顯示 eval 的 console
        resolve(params)
      } else {
        if (params) {
          store.commit("SET_RESPONSE_DATA", params);
          store.commit("SET_CURRENT_TAB_RESPONSE_DATA", params);
          logData.handleLogData(params, params.status)
        }
      }


    });
  })

  // ipcRenderer.once(uniqueName, (event, params) => {
  //   // 這裡的 params 是從主進程中返回的值
  //   // console.log('Received params from main process:', params);

  //   if (params) {
  //     store.commit("SET_RESPONSE_DATA", params);
  //     store.commit("SET_CURRENT_TAB_RESPONSE_DATA", params);
  //     logData.handleLogData(params, params.status)
  //   }
  // });
  // ipcRenderer.send('ipc-http-request', arg)
}

const ipcHttpCallback = (isReturnResponseData) => {
  return new Promise(resolve => {
    ipcRenderer.once('ipc-http-request-cb', (event, arg) => {
      if (isReturnResponseData) { // 用於顯示 eval 的 console
        resolve(arg)
      } else {
        if (arg) {
          store.commit("SET_RESPONSE_DATA", arg);
          store.commit("SET_CURRENT_TAB_RESPONSE_DATA", arg);
          logData.handleLogData(arg, arg.status)
        }
      }
    })
  })
}

const omScriptEventStart = () => {
  ipcRenderer.send('om-script-event-start')
}

const omScriptEventEnd = () => {
  ipcRenderer.send('om-script-event-end')
}

ipcRenderer.on('overwite-event', (event, arg) => {
  modal.confirm({
    title: '同步衝突',
    content: `欲變動的${arg.activityType}當前已被${arg.actionType}，是否進行複寫？`,
    okText: '複寫',
    cancelText: '取消',
    onOk () {
      event.sender.send('overwite-event-cb', true)
    },
    onCancel () {
      event.sender.send('overwite-event-cb', false)
    }
  })
})

export { ipcHttpRequest, ipcHttpCallback, omScriptEventStart, omScriptEventEnd }

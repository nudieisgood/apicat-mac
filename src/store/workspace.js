import { reactive, ref, watch, computed } from 'vue'
import { getParticipant } from '@/js/ipc/participantIPC.js'
import { getWorkspace, editWorkspace, getWorkspaceList, getWorkspaceTree, editWorkspaceOwner } from '@/js/ipc/workspaceIPC.js'
import { editEnvironment } from '@/js/ipc/environmentIPC.js'
import { editCollection, createCollection } from '@/js/ipc/collectionIPC.js'
import tabsData from '@/store/tabs'
import store from '@/store'
import Helper from '@/js/utils/helper'
import { classifyType } from '@/js/enum/typeEnum.js'
import { createFolder, moveFolder, copyFolder } from "@/js/ipc/folderIPC.js";
import { createItem, moveItem, editItem, copyItem } from "@/js/ipc/itemIPC.js";
import { leaveWorkspace } from "@/js/ipc/participantIPC.js";
import TypeEnum from "@/js/enum/typeEnum.js";



const userState = computed(() => {
  return store.getters.getUserState;
});

const currentWorkspace = computed(() => {
  return store.getters.getCurrentWorkspace;
});

const environments = computed(() => {
  return store.getters.getEnvironmentList;
});

const items = computed(() => {
  return store.getters.getCurrentWorkspaceItems;
});

const tabsPane = computed(() => {
  return store.getters.getTabsPane;
});

const variablesState = computed(() => {
  return store.getters.getVariablesState;
});

const selectedEnvironmentId = computed(() => {
  return store.getters.getSelectedEnvironmentId;
});

const initWorkspaceData = async(changedWorkspaceId) => {
  store.commit("SET_SHOW_LAYOUT_LOADING_MODE", true);
  store.commit("RESET_WORKSPACE");
  let id = changedWorkspaceId || workspaceList.value[0].workspaceId

  try {
    await setCurrentWorkspaceData(id);
    await getParticipantList(id);
    store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
  } catch (error) {
    // 處理可能的錯誤
    console.error(error);
    store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
  }
}

// 取得所有 workspace 列表
const getAllWorkspaceList = async () => {
  await getWorkspaceList();
}

/**
 * 取得及設定單筆工作區資料
 * @param {Number} workspaceId - 欲取得及設置的工作區ID
 */
const setCurrentWorkspaceData = async (workspaceId) => {

  await getWorkspaceTreeData(workspaceId)
  // await getWorkspaceTree({ workspaceId: workspaceId })
  store.commit("UPDATE_USER_EDIT_RIGHT", checkWorkspaceCreator(userState.value.id));
  store.commit("SET_WORKSPACE_ID", workspaceId);
  store.commit("SET_WORKSPACE_ARRAY", workspaceId);
  store.commit("SET_TABS_PANE");
}


const getWorkspaceTreeData = async (workspaceId) => {
  const obj = {
    workspaceId: workspaceId
  }
  // console.log('getWorkspaceTree obj__', obj) // NOTE: 有時 vsc 存檔後，這裡會是 null
  await getWorkspaceTree(obj)
}

const handleParticipantList = (list) => {
  return list.filter(e => e.status === 1)
}

// 尋找當前登入者資料並做資料更新
const searchCurrentUserInfo = (list) => {
  list.forEach((e, index) => {
    if (e.userId === userState.value.id) {
      store.commit("UPDATE_USER_EDIT_RIGHT", e.editable);
    }
  })
}

/**
 * 確認使用者id是否為當前workspace的創建者，用於兩種情況的判斷：
 * 1. 在成員列表裡，若該名成員為當前workspace的創建者，則其他admin不可以把創建者移除
 * 2. 當前登入者是否為該workspace的創建者，是創建者則顯示刪除及編輯workspace的功能，否則隱藏(左上角workspace列表)
 */

const checkWorkspaceCreator = (userId) => {

  // workspace 裡沒 ownerId
  // if (currentWorkspace.value.ownerId === userId) {
  if (currentWorkspace.value.creatorId === userId) {
    return true
  }
  return false

}


// 取得當前環境資料
const getSelectedEnvironment = () => {
  const found = environments.value.find((e) => e.id === selectedEnvironmentId.value)
  return found
}

const currentTabData = computed(() => {
  return store.getters.getCurrentTabData;
});

/**
 * 設定 / 更新 variablesScope，觸發時機有：
 * 1. 切換tab
 * 2. 切換環境 (environment)
 * 3. 編輯 collection variable / global variable / environment variable 並儲存時
 */

const reloadVariables = () => {
  let getTargetCollectionResult = getTargetCollection(currentTabData.value.id)
  let scope = {
    collectionVariable : currentTabData.value && getTargetCollectionResult ? getTargetCollectionResult?.variable : [],
    globalVariable : currentWorkspace.value.variable ? currentWorkspace.value.variable : [],
    environmentVariable : getSelectedEnvironment() ? getSelectedEnvironment().variable : []
  }
  store.commit("SET_VARIABLES_STATE", scope);
}

const updateGlobalsVariable = async () => {
  const obj = {
    workspaceId: currentWorkspace.value.id,
    workspaceName: currentWorkspace.value.name,
    variable: variablesState.value.globalVariable ? variablesState.value.globalVariable : undefined
  }

  const res = await editWorkspace(obj)

  if (res.code === 20000) {
    res.data.tabType = 'globals'
    store.commit('UPDATE_TAB', res.data)
    let scope = {
      globalVariable: res.data.variable
    }
    store.commit("SET_VARIABLES_STATE", scope);
  }
}

const updateEnvironmentVariable = async () => {
  const currentEnvironment = getSelectedEnvironment()
  if (!currentEnvironment) {
    return
  }

  const obj = {
    environmentId: selectedEnvironmentId.value,
    workspaceId: currentWorkspace.value.id,
    environmentName: currentEnvironment.name,
    variable: variablesState.value.environmentVariable
  }

  const res = await editEnvironment(obj)

  if (res) {
    res.data.tabType = 'environment'
    store.commit('UPDATE_TAB', res.data)
    let scope = {
      environmentVariable: res.data.variable
    }
    store.commit("SET_VARIABLES_STATE", scope);
  }
}

const getTargetCollection = (targetId) => {
  const getMatchCollection = (item, id) => {
    for (let i = 0; i < item.length; i++) {
      if (item[i].id === id) {
        if (item[i].parentId === -1) {
          return item[i]
        }
        // return item[i]
        return getMatchCollection(items.value, item[i].parentId)
      }
      if (item[i].item && item[i].item.length > 0) {
        const result = getMatchCollection(item[i].item, id)
        if (result) {
          return result
        }
      }
    }
    return undefined
  }
  const result = getMatchCollection(items.value, targetId)
  if (result) {
    return result
  }
}

const updateCollectionVariable = async () => {
  const currentCollection = getTargetCollection(currentTabData.value.id)
  if (!currentCollection) {
    return
  }
  if (!currentCollection.variable) {
    currentCollection.variable = []
  }

  const obj = {
    collectionsId: currentCollection.id,
    variable: variablesState.value.collectionVariable ? variablesState.value.collectionVariable : undefined,
    workspaceId: currentCollection.workspaceId
  }

  const res = await editCollection(obj)
  if (res) {
    res.data.tabType = classifyType(res.data)
    const initData = tabsData.checkTypeToInitAndUseData(JSON.parse(JSON.stringify(res.data)))
    store.commit('UPDATE_TAB', initData)
  }
}

const updateVariableData = async (script) => {
  const promises = []
  if (script.indexOf('globals.set') > -1 || script.indexOf('globals.unset') > -1) {
    promises.push(updateGlobalsVariable());
  }

  if (script.indexOf('collectionVariables.set') > -1 || script.indexOf('collectionVariables.unset') > -1) {
    promises.push(updateCollectionVariable());
  }

  if (script.indexOf('environment.set') > -1 || script.indexOf('environment.unset') > -1) {
    promises.push(updateEnvironmentVariable());
  }

  await Promise.all(promises);
  // console.log('All updates completed')
}

// 樹狀資料有更動時(比如修改collection variable)，須更新 variablesScope
watch(() => items, (newVal, oldVal) => {
  if (!items.value.length) return
  if (!tabsPane.value.length) return // 若沒開啟任何頁籤，不執行；開啟頁籤且頁籤 type 為 request 時再取變數
  reloadVariables()
}, {
  immediate: true
})

// 切換環境時，須更新 variablesScope
watch(selectedEnvironmentId, () => {
  if (!selectedEnvironmentId.value) return
  reloadVariables()
}, {
  // immediate: true
})

// request url有使用變數時，hover該變數需顯示對應資訊；從 variablesScope 查
// 順序為：environment variable -> collection variable -> global variable
const searchVariableInRequestUrl = (variableKey) => {
  const obj = {}
  let isFound = false

  if (variablesState.value.environmentVariable?.length > 0) {
      variablesState.value.environmentVariable.forEach((el) => {
      if (`{{${el.key}}}` === variableKey) {
        if (!el.disabled) {
          Object.assign(obj, el);
          obj.scopeType = 'Environment'
          isFound = true
        }
      }
    })
  }

  if (isFound) return obj


  if (variablesState.value.collectionVariable?.length > 0) {
    variablesState.value.collectionVariable.forEach((el) => {
      if (`{{${el.key}}}` === variableKey) {
        if (!el.disabled) {
          Object.assign(obj, el);
          obj.scopeType = 'Collection'
          isFound = true
        }
      }
    })
  }

  if (isFound) return obj

  if (variablesState.value.globalVariable?.length > 0) {
    variablesState.value.globalVariable.forEach((el) => {
      if (`{{${el.key}}}` === variableKey) {
        if (!el.disabled) {
          Object.assign(obj, el);
          obj.scopeType = 'Global'
          isFound = true
        }
      }
    })
  }

  if (isFound) return obj
  return false
}

const addCollection =async () => {
  const createData = {
    collectionsName: "New Collection",
    workspaceId: currentWorkspace.value.id,
  };

  const res = await createCollection(createData);
  return res
};

const addFolder =async (id) => {
  const createData = {
    parentId: id,
    folderName: "New Folder",
    workspaceId: currentWorkspace.value.id,
  };

  const res = await createFolder(createData);
  return res
};

const addRequest =async (id) => {
  const createData = {
    workspaceId: currentWorkspace.value.id,
    itemsName: "New Request",
    parentId: id,
    request: {
      method: "GET",
    },
  };
  const res = await createItem(createData);
  return res
};

const handleLeaveWorkspace = async (workspaceId) => {
  const obj = {
    workspaceId: workspaceId,
  };
  const res = await leaveWorkspace(obj);
  if (res.code === 20000) {
    await getAllWorkspaceList();

    // 若退出的是當前工作區，需要重新取得一筆工作資料
    if (workspaceId === currentWorkspace.value.id) {
      store.commit("RESET_WORKSPACE_ID");
      store.commit("DELETE_SINGLE_WORKSPACE", workspaceId.value); // 因退出了，所以要把此紀錄移除
      await initWorkspaceData();
    }
  }
  return res
};

const handleWorkspaceOwner = async (workspaceId, newOwnerId) => {
  const obj = {
    workspaceId: workspaceId,
    userId: newOwnerId
  };
  const res = await editWorkspaceOwner(obj);
  if (res.code === 20000) {
    // 轉移workspace擁有者成功後，要更新workspace列表
    await getAllWorkspaceList();
  }
  return res
};

// 2023/11/29
const workspaceList = computed(() => {
  return store.getters.getWorkspaceList
})

// 取得工作區參與者列表
const getParticipantList = async (workspaceId) => {

  const obj = {
    workspaceId: workspaceId || currentWorkspace.value.id
  }
  const res = await getParticipant(obj)
  if (res.code === 20000) {
    store.commit("SET_PARTICIPANT_LIST", handleParticipantList(res.data));
    searchCurrentUserInfo(res.data)
  }
}

const setWorkspaceState = async () => {
  store.commit("SET_SHOW_LAYOUT_LOADING_MODE", true);
  let tempWorkspaceId = null
  await getAllWorkspaceList()

  if (store.getters.getSelectedWorkspaceId) {
    tempWorkspaceId = store.getters.getSelectedWorkspaceId
  } else if (workspaceList.value && workspaceList.value.length) {
    tempWorkspaceId = workspaceList.value[0].workspaceId
  }
  Promise.all([setCurrentWorkspaceData(tempWorkspaceId), getParticipantList(tempWorkspaceId)])
    .then(() => {
      store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
    }, (fail) => {
      console.log('fail__', fail);
      store.commit("SET_SHOW_LAYOUT_LOADING_MODE", false);
    });

}

export default {
  searchCurrentUserInfo,
  checkWorkspaceCreator,
  getSelectedEnvironment,
  updateEnvironmentVariable,
  getTargetCollection,
  reloadVariables,
  updateVariableData,
  searchVariableInRequestUrl,
  getAllWorkspaceList,
  initWorkspaceData,
  addCollection,
  addFolder,
  addRequest,
  handleLeaveWorkspace,
  handleWorkspaceOwner,
  setWorkspaceState,
  getParticipantList
}

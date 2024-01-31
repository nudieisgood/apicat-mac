import { app } from 'electron'
import collectionApi from '@/js/api/collectionApi.js'

const path = app.getPath('userData')

const Loki = require('lokijs')
var db = new Loki(`${path}\\workspace.json`, { serializationMethod: 'pretty' })

let workspace = null
let timestamp = null
let tabView = null

db.loadDatabase({}, () => {
  // 定義所有DB內的collections
  workspace = db.getCollection('workspace')
    ? db.getCollection('workspace')
    : db.addCollection('workspace', {
      clone: true,
      unique: 'workspaceId'
    })

  timestamp = db.getCollection('timestamp')
    ? db.getCollection('timestamp')
    : db.addCollection('timestamp', {
      clone: true,
      unique: 'workspaceId'
    })

  tabView = db.getCollection('tabView')
    ? db.getCollection('tabView')
    : db.addCollection('tabView', {
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
 * 登出後刪除workspace, timestamp, tabView資料
 */
const removeWorkspace = async () => {
  try {
    workspace.clear()
    timestamp.clear()
    tabView.clear()
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') removeWorkspace()
    console.log(error)
  }
}

/**
 * 設定時間戳記
 */
const setTimestamp = async (workspaceId) => {
  try {
    timestamp.insert({
      workspaceId,
      timestamp: Date.now()
      // timestamp: Math.floor(new Date(time).getTime())
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') setTimestamp(workspaceId)
    console.log(error)
  }
}

/**
 * 重設時間戳記
 */
const updateTimestamp = async (workspaceId, time) => {
  try {
    timestamp.findAndUpdate({ workspaceId }, (doc) => {
      doc.timestamp = time
      // doc.timestamp = Date.now()
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') updateTimestamp(workspaceId)
    console.log(error)
  }
}

/**
 * 刪除時間戳記
 */
const deleteTimestamp = async (workspaceId) => {
  try {
    timestamp.findAndRemove({ workspaceId: workspaceId })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteTimestamp(workspaceId)
    console.log(error)
  }
}

/**
 * 獲取時間戳記
 */
const getTimestamp = () => {
  return db.getCollection('timestamp') ? db.getCollection('timestamp').data : []
}

/**
 * 獲取特定時間戳記
 */
const getSingleTimestamp = (workspaceId) => {
  return timestamp.findOne({ workspaceId: workspaceId })
}

/**
 * 設定request view 打開時的時間戳記
 */
const setTabViewTS = async (workspaceId, id) => {
  try {
    if (!getTabViewTS(id)) {
      tabView.insert({
        id,
        timestamp: getSingleTimestamp(workspaceId).timestamp
      })
      await save()
    }
  } catch (error) {
    if (error.code === 'ETIMEDOUT') setTabViewTS(id)
    console.log(error)
  }
}

/**
 * 重設request view 的時間戳記
 */
const updateTabViewTS = async (id, time) => {
  try {
    tabView.findAndUpdate({ id }, (doc) => {
      doc.timestamp = time
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') updateTabViewTS(id, time)
    console.log(error)
  }
}

/**
 * 刪除request view 的時間戳記
 */
const deleteTabViewTS = async (id) => {
  try {
    tabView.findAndRemove({ id })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteTabViewTS(id)
    console.log(error)
  }
}

/**
 * 獲取特定request view 的時間戳記
 */
const getTabViewTS = (id) => {
  return tabView.findOne({ id })
}

/**
 * 獲取已進入localDB的workspace
 */
const getWorkspace = () => {
  return db.getCollection('workspace').data
}

/**
 * 同步事件
 * @param {Array} arg - 同步資料
 * @param {String} type - 自動/手動同步
 */
let importIDList = []
const activityWorkspace = async (arg, type) => {
  try {
    if (arg.length) {
      // 針對api 回傳的資料做重新排序並移除重複值
      arg.sort(function (a, b) {
        return a.id - b.id
      })
      const ts = getSingleTimestamp(arg[0].workspaceId)
      const index = arg.findIndex((item) => item.createdAt === ts.timestamp)
      if (index !== -1) arg.splice(index, 1)

      const allTasks = []
      arg.forEach(item => {
        const task = async () => {
          if (importIDList.length && item.superiorTree) {
            const importID = importIDList.find(element => element === item.superiorList.superiorList[0])
            if (importID) return
          }
          switch (item.activityType) {
            case 0: // workspace
              switch (item.actionType) {
                case 0:
                  await createWorkspace(item.workspaceHistory)
                  break
                case 1:
                  await editWorkspace(item.workspaceHistory)
                  break
                case 2:
                  await deleteWorkspace(item)
                  await deleteTimestamp(item.workspaceId)
                  break
                case 3:
                  break
                default:
                  break
              }
              break
            case 1: // collections
              switch (item.actionType) {
                case 0:
                  await createCollections(item.collectionsHistory)
                  break
                case 1:
                  await editCollections(item.collectionsHistory)
                  break
                case 2:
                  await deleteCollections(item)
                  break
                case 4:
                  await importCollection(item)
                  break
                default:
                  break
              }
              break
            case 2: // folder
              switch (item.actionType) {
                case 0:
                  await createFolder(item.collectionsHistory)
                  break
                case 1:
                  await editFolder(item.collectionsHistory)
                  break
                case 2:
                  await deleteFolder(item)
                  break
                case 3:
                  await moveFolder(item.collectionsHistory)
                  break
                case 4:
                  await copyFolder(item)
                  break
                default:
                  break
              }
              break
            case 3: // items
              switch (item.actionType) {
                case 0:
                  await createItem(item.itemsHistory)
                  break
                case 1:
                  await editItem(item.itemsHistory)
                  break
                case 2:
                  await deleteItem(item)
                  break
                case 3:
                  await moveItem(item.itemsHistory)
                  break
                default:
                  break
              }
              break
            case 4: // environment
              switch (item.actionType) {
                case 0:
                  await createEnvironment(item.environmentHistory)
                  break
                case 1:
                  await editEnvironment(item.environmentHistory)
                  break
                case 2:
                  await deleteEnvironment(item)
                  break
                default:
                  break
              }
              break
            default:
              break
          }
          await updateTimestamp(item.workspaceId, item.createdAt)
          if (!type) updateTabViewTS(item.targetId, item.createdAt)
        }
        allTasks.push(task())
      })
      await Promise.all(allTasks)

      importIDList = []
    }
  } catch (error) {
    if (error.code === 'ETIMEDOUT') activityWorkspace(arg)
    console.log(error)
  }
}

/**
 * 新增json tree
 * @param {Object} arg - json tree資料
 * @param {String} arg.id - json tree的id
 * @param {String} arg.workspace - json tree的workspace
 * @param {String} arg.environments - json tree的environments
 * @param {String} arg.item - json tree的collections
 */
const createJsonTree = async (arg) => {
  try {
    workspace.insert({
      workspaceId: arg.workspace.id,
      workspace: arg.workspace,
      environments: arg.environments,
      item: arg.item
    })
    setTimestamp(arg.workspace.id)
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createJsonTree(arg)
    console.log(error)
  }
}

/**
 * 根據id取得json tree
 */
const findJsonTree = (arg) => {
  return workspace.findOne({ workspaceId: arg.workspaceId })
}

// workspace
/**
 * 新增workspace
 */
const createWorkspace = async (arg) => {
  try {
    workspace.insert({
      workspaceId: arg.workspaceId,
      workspace: {
        name: arg.name,
        summary: arg.summary,
        variable: arg.variable,
        creatorId: arg.creatorId,
        createdAt: arg.createdAt,
        updaterId: arg.updaterId,
        updatedAt: arg.updatedAt,
        id: arg.workspaceId
      },
      environments: [],
      item: []
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createWorkspace(arg)
    console.log(error)
  }
}

/**
 * 編輯workspace
 */
const editWorkspace = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.workspace.name = arg.name
      doc.workspace.summary = arg.summary
      doc.workspace.variable = arg.variable
      doc.workspace.updaterId = arg.updaterId
      doc.workspace.updatedAt = arg.updatedAt
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') editWorkspace(arg)
    console.log(error)
  }
}

/**
 * 刪除workspace
 */
const deleteWorkspace = async (arg) => {
  try {
    workspace.findAndRemove({ workspaceId: arg.workspaceId })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteWorkspace(arg)
    console.log(error)
  }
}

// environment
/**
 * 新增environment
 */
const createEnvironment = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const data = {
        workspaceId: arg.workspaceId,
        name: arg.name,
        variable: arg.variable,
        creatorId: arg.creatorId,
        createdAt: arg.createdAt,
        updaterId: arg.updaterId,
        updatedAt: arg.updatedAt,
        id: arg.environmentId
      }
      doc.environments.push(data)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createEnvironment(arg)
    console.log(error)
  }
}

/**
 * 編輯environment
 */
const editEnvironment = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const index = doc.environments.findIndex((item) => item.id === arg.environmentId)
      doc.environments[index].name = arg.name
      doc.environments[index].variable = arg.variable
      doc.environments[index].updaterId = arg.updaterId
      doc.environments[index].updatedAt = arg.updatedAt
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') editEnvironment(arg)
    console.log(error)
  }
}

/**
 * 刪除environment
 */
const deleteEnvironment = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const index = doc.environments.findIndex((item) => item.id === arg.targetId)
      doc.environments.splice(index, 1)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteEnvironment(arg)
    console.log(error)
  }
}

// collections
/**
 * 新增collections
 */
const createCollections = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const data = {
        item: [],
        id: arg.collectionsId,
        parentId: arg.parentId,
        position: arg.position,
        workspaceId: arg.workspaceId,
        name: arg.name,
        description: arg.description,
        variable: arg.variable,
        event: arg.event,
        auth: arg.auth,
        creatorId: arg.creatorId,
        createdAt: arg.createdAt,
        updaterId: arg.updaterId,
        updatedAt: arg.updatedAt
      }
      doc.item.push(data)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createCollections(arg)
    console.log(error)
  }
}

/**
 * 編輯collection
 */
const editCollections = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const index = doc.item.findIndex((item) => item.id === arg.collectionsId)
      doc.item[index].name = arg.name
      doc.item[index].description = arg.description
      doc.item[index].variable = arg.variable
      doc.item[index].event = arg.event
      doc.item[index].auth = arg.auth
      doc.item[index].updaterId = arg.updaterId
      doc.item[index].updatedAt = arg.updatedAt
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') editCollections(arg)
    console.log(error)
  }
}

/**
 * 刪除collection
 */
const deleteCollections = async (arg) => {
  try {
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      const index = doc.item.findIndex((item) => item.id === arg.targetId)
      doc.item.splice(index, 1)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteCollections(arg)
    console.log(error)
  }
}

/**
 * 匯入Collection
 */
// const getCollection = async (arg) => {
//   const data = {
//     workspaceId: arg.workspaceId,
//     collectionsId: arg.targetId
//   }
//   const res = await collectionApi.getCollectionTree(data)
//   return res
// }

const importCollection = async (arg) => {
  try {
    const data = {
      workspaceId: arg.workspaceId,
      collectionsId: arg.targetId
    }
    const res = await collectionApi.getCollectionTree(data)
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, async (doc) => {
      doc.item.push(res.data)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') importCollection(arg)
    console.log(error)
  }
}

// folder
/**
 * 新增folder
 */
const createFolder = async (arg) => {
  try {
    const loopCreateFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.parentId) {
          const data = {
            item: [],
            parentId: arg.parentId,
            position: arg.position,
            workspaceId: arg.workspaceId,
            name: arg.name,
            description: arg.description,
            variable: arg.variable,
            event: arg.event,
            auth: arg.auth,
            creatorId: arg.creatorId,
            createdAt: arg.createdAt,
            updaterId: arg.updaterId,
            updatedAt: arg.updatedAt,
            id: arg.collectionsId
          }
          // node.item.push(data)
          node.item = sortItems(node, data)
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopCreateFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopCreateFolder(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createFolder(arg)
    console.log(error)
  }
}

/**
 * 編輯folder
 */
const editFolder = async (arg) => {
  try {
    const loopEditFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.collectionsId) {
          node.name = arg.name
          node.description = arg.description
          node.variable = arg.variable
          node.event = arg.event
          node.auth = arg.auth
          node.updaterId = arg.updaterId
          node.updatedAt = arg.updatedAt
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopEditFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopEditFolder(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') editFolder(arg)
    console.log(error)
  }
}

/**
 * 移動folder
 */
const moveFolder = async (arg) => {
  try {
    let tempNode = null
    const loopDeleteFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node, index) => {
        if (node.id === arg.collectionsId) {
          tempNode = node
          nodes.splice(index, 1)
          return
        }

        if (node.item && node.item.length) {
          loopDeleteFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    const loopCreateFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.parentId) {
          if (!node.item) {
            node.item = []
          }
          // Object.keys(tempNode).forEach(key => {
          //   tempNode[key] = arg[key]
          // })
          tempNode.parentId = arg.parentId
          tempNode.position = arg.position
          node.item = sortItems(node, tempNode)
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopCreateFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopDeleteFolder(doc.item)
      doc.item = loopCreateFolder(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') moveFolder(arg)
    console.log(error)
  }
}

/**
 * 刪除folder
 */
const deleteFolder = async (arg) => {
  try {
    const loopDeleteFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node, index) => {
        if (node.id === arg.targetId) {
          nodes.splice(index, 1)
          nodes = sortItems(nodes, null)
          return
        }

        if (node.item && node.item.length) {
          loopDeleteFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopDeleteFolder(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteFolder(arg)
    console.log(error)
  }
}

/**
 * 複製folder
 */

const copyFolder = async (arg) => {
  try {
    const obj = {
      workspaceId: arg.workspaceId,
      collectionsId: arg.targetId
    }
    const { data } = await collectionApi.getCollectionTree(obj)

    const loopCopyFolder = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === data.parentId) {
          const item = {
            item: data.item,
            parentId: data.parentId,
            position: data.position,
            workspaceId: data.workspaceId,
            name: data.name,
            description: data.description,
            variable: data.variable,
            event: data.event,
            auth: data.auth,
            creatorId: data.creatorId,
            createdAt: data.createdAt,
            updaterId: data.updaterId,
            updatedAt: data.updatedAt,
            id: data.id
          }
          node.item = sortItems(node, item)
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopCopyFolder(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }

    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopCopyFolder(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') copyFolder(arg)
    console.log(error)
  }
}

// item
/**
 * 新增item
 */
const createItem = async (arg) => {
  try {
    const loopCreateItem = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.parentId) {
          if (!node.item) {
            node.item = []
          }
          const data = {
            parentId: arg.parentId,
            position: arg.position,
            workspaceId: arg.workspaceId,
            name: arg.name,
            description: arg.description,
            event: arg.event,
            request: arg.request,
            response: arg.response,
            creatorId: arg.creatorId,
            createdAt: arg.createdAt,
            updaterId: arg.updaterId,
            updatedAt: arg.updatedAt,
            id: arg.itemsId
          }
          // node.item.push(data)
          node.item = sortItems(node, data)
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopCreateItem(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }

    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopCreateItem(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') createItem(arg)
    console.log(error)
  }
}

/**
 * 編輯item
 */
const editItem = async (arg) => {
  try {
    const loopEditItem = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.itemsId) {
          node.name = arg.name
          node.description = arg.description
          node.request = arg.request
          node.response = arg.response
          node.event = arg.event
          node.updaterId = arg.updaterId
          node.updatedAt = arg.updatedAt
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopEditItem(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopEditItem(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') editItem(arg)
    console.log(error)
  }
}

/**
 * 移動item
 */
const moveItem = async (arg) => {
  try {
    let tempNode = null
    const loopDeleteItem = (nodes) => {
      const newDoc = []

      nodes.forEach((node, index) => {
        if (node.id === arg.itemsId) {
          tempNode = node
          nodes.splice(index, 1)
          return
        }

        if (node.item && node.item.length) {
          loopDeleteItem(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    const loopCreateItem = (nodes) => {
      const newDoc = []

      nodes.forEach((node) => {
        if (node.id === arg.parentId) {
          if (!node.item) {
            node.item = []
          }
          // Object.keys(tempNode).forEach(key => {
          //   tempNode[key] = arg[key]
          // })
          tempNode.parentId = arg.parentId
          tempNode.position = arg.position
          node.item = sortItems(node, tempNode)
          newDoc.push(node)
          return
        }

        if (node.item && node.item.length) {
          loopCreateItem(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }

    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopDeleteItem(doc.item)
      doc.item = loopCreateItem(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') moveItem(arg)
    console.log(error)
  }
}

/**
 * 刪除item
 */
const deleteItem = async (arg) => {
  try {
    const loopDeleteItem = (nodes) => {
      const newDoc = []

      nodes.forEach((node, index) => {
        if (node.id === arg.targetId) {
          nodes.splice(index, 1)
          nodes = sortItems(nodes, null)
          return
        }

        if (node.item && node.item.length) {
          loopDeleteItem(node.item)
        }

        newDoc.push(node)
      })

      return newDoc.length ? newDoc : []
    }
    workspace.findAndUpdate({ workspaceId: arg.workspaceId }, (doc) => {
      doc.item = loopDeleteItem(doc.item)
    })
    await save()
  } catch (error) {
    if (error.code === 'ETIMEDOUT') deleteItem(arg)
    console.log(error)
  }
}

const sortItems = (node, arg) => {
  const foldersArray = []
  const itemsArray = []
  if (arg) {
    node.item.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(item, 'item')) {
        foldersArray.push(item)
      } else {
        itemsArray.push(item)
      }
    })

    if (Object.prototype.hasOwnProperty.call(arg, 'item')) {
      foldersArray.splice(arg.position - 1, 0, arg)
      foldersArray.forEach((item, index) => {
        item.position = index + 1
      })
    } else {
      itemsArray.splice(arg.position - 1, 0, arg)
      itemsArray.forEach((item, index) => {
        item.position = index + 1
      })
    }
  } else {
    node.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(item, 'item')) {
        foldersArray.push(item)
      } else {
        itemsArray.push(item)
      }

      foldersArray.forEach((item, index) => {
        item.position = index + 1
      })
      itemsArray.forEach((item, index) => {
        item.position = index + 1
      })
    })
  }

  return foldersArray.concat(itemsArray)
}

export {
  removeWorkspace,
  setTimestamp,
  updateTimestamp,
  getTimestamp,
  getSingleTimestamp,
  setTabViewTS,
  updateTabViewTS,
  deleteTabViewTS,
  getTabViewTS,
  getWorkspace,
  activityWorkspace,
  createJsonTree,
  findJsonTree,
  createWorkspace,
  editWorkspace,
  deleteWorkspace,
  createEnvironment,
  editEnvironment,
  deleteEnvironment,
  createCollections,
  editCollections,
  deleteCollections,
  importCollection,
  createFolder,
  editFolder,
  moveFolder,
  deleteFolder,
  createItem,
  editItem,
  moveItem,
  deleteItem
}

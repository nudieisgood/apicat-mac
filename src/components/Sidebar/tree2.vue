<template>
  <div id="sidebar-tree-wrapper">
    <div class="sidebar-tree__operation">
      <action-menu
        @create="addCollection"
        @search="keywordSearch"
        :current-tab-name="'Collection'"
      />
    </div>

    <div
      class="sidebar-tree"
      v-if="
        workspaceData.workspace.item && workspaceData.workspace.item.length > 0
      "
    >
      <a-tree
        v-if="tempTreeData && tempTreeData.length > 0"
        :tree-data="tempTreeData"
        :field-Names="replaceFields"
        :show-icon="true"
        @expand="onExpand"
        :draggable="isDraggable"
        @drop="onDrop"
        :expandedKeys="expandedKeys"
        :auto-expand-parent="autoExpandParent"
        :height="virtualHeight"
        :motion="null"
      >
        <template #title="{ data, tabType, tabKey, request, name }">
          <div class="tree-view-item">
            <div class="tree-view-left">
              <div class="node-box" @click="openTab(data)">
                <span
                  class="node-box__icon"
                  v-if="tabType === TypeEnum.folder.name"
                  ><folder-outlined
                /></span>
                <span
                  class="node-box__icon"
                  v-else-if="tabType === TypeEnum.example.name"
                >
                  <img :src="require('@/assets/img/icon-example.png')" alt="" />
                </span>
                <span
                  class="node-box__request-method method-label"
                  v-if="request"
                  :class="tabsData.classifyMethodColor(request.method)"
                  >{{ request.method }}</span
                >
                <div class="node-box__name-wrapper">
                  <a-input
                    v-if="isShowRenameInput && tabKey === selectedKey"
                    v-model:value="selectedData.name"
                    @blur="onBlur(data)"
                    class="edit-input"
                    @keyup.enter="inputPressEnter(data)"
                    @mousedown="handleMousedown"
                    @click.stop
                    v-focus
                    ref="renameInputRef"
                  />
                  <span v-else class="node-box__name">{{ name }}</span>
                </div>
              </div>
            </div>

            <div
              class="tree-view-right"
              v-if="user.userInfo.isEditable"
              :id="`${tabKey}`"
            >
              <a-popover
                trigger="click"
                placement="bottomRight"
                :open="tabKey === selectedData.tabKey && actionsVisible"
                overlayClassName="tree-action-list-popover"
                :destroyTooltipOnHide="true"
              >
                <template #content>
                  <ul class="action-list">
                    <template
                      v-for="(option, index) in barOptions"
                      :key="index"
                    >
                      <li
                        v-if="option.isShow(data)"
                        @click="option.function(data)"
                        :class="`${option.type}`"
                      >
                        <a :class="`actions-item actions-item--${option.type}`"
                          >{{ option.label }}
                          <span class="hot-key" v-if="option.hotKey">{{
                            option.hotKey
                          }}</span>
                        </a>
                      </li>
                    </template>
                  </ul>
                </template>
                <span
                  class="btn-popup icon-list"
                  @click.stop="openList(data)"
                  v-click-outside="onClickOutside"
                >
                </span>
              </a-popover>
            </div>
          </div>
        </template>
      </a-tree>
      <p v-else-if="showTip && tempTreeData.length === 0" class="tip-text">
        No results found
      </p>
    </div>
    <div v-else class="empty-block-wrapper">
      <div class="empty-block" v-if="!workspaceData.workspace.workspaceId">
        <div class="empty-block__header">No workspace</div>
      </div>
      <div class="empty-block" v-else>
        <div class="empty-block__header">
          Create a collection for your requests
        </div>
        <div class="empty-block__content">
          <p>
            A collection lets you group related requests and easily set common
            authorization, tests, scripts, and variables for all requests in it.
          </p>
        </div>
        <div class="empty-block__button" v-if="user.userInfo.isEditable">
          <a-button class="" @click="addCollection">
            <template #icon><plus-outlined /></template>
            Create Collection
          </a-button>
        </div>
      </div>
    </div>
  </div>

  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="isShowTipDialog = false"
    :deleted-data="selectedData"
    :tree-data="tempTreeData"
  />
  <!-- <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="isShowTipDialog = false"
    :deleted-data="selectedData"
    :tree-data="data.treeData"
  /> -->
  <export-dialog
    v-if="isShowExportDialog"
    :dialogVisible="isShowExportDialog"
    @close-export-dialog="isShowExportDialog = false"
    :collection-Info="selectedData"
  />
</template>
<script>
import {
  watch,
  reactive,
  getCurrentInstance,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  inject,
} from "vue";
import workspaceData from "@/store/workspace";
import { copyCollection } from "@/js/ipc/collectionIPC.js";
import { moveFolder, copyFolder } from "@/js/ipc/folderIPC.js";
import { moveItem, editItem, copyItem } from "@/js/ipc/itemIPC.js";
import TipDialog from "@/components/TipDialog";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import tabsData from "@/store/tabs";
import { useStore } from "vuex";
import user from "@/store/user";
import exportDialog from "@/components/Sidebar/exportDialog.vue";
import Helper from "@/js/utils/helper";
import ActionMenu from "@/components/Sidebar/actionMenu.vue";

const focus = {
  mounted(el) {
    el.focus();
  },
};

export default {
  components: {
    TipDialog,
    exportDialog,
    ActionMenu,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const $message = inject("$message");
    const store = useStore();
    const app = getCurrentInstance();
    const actionsVisible = ref(false);
    const replaceFields = {
      children: "item",
      title: "name",
      key: "tabKey",
      // key: "tabKey",
    };

    const expandedKeys = ref([]);
    const autoExpandParent = ref(true);

    const onExpand = (keys, record) => {
      expandedKeys.value = keys;
      autoExpandParent.value = false;
    };

    const originTreeData = ref([]);

    const data = reactive({
      treeData: [],
    });

    const addCollection = Helper.throttle(async () => {
      if (!workspaceData.workspace.workspaceId) {
        $message.warning("Select a workspace!");
        return;
      }

      const res = await workspaceData.addCollection();

      if (res.code === 20000) {
        res.data.tabType = TypeEnum.collection.name;
        // res.data.tabKey = res.data.id;

        openNotification("success", "Create collection successfully.");

        openTab(res.data);
      } else {
        openNotification("success", res.message);
      }
    });

    const addFolder = Helper.throttle(async (data) => {
      const originalExpandedKeys = JSON.parse(
        JSON.stringify(expandedKeys.value)
      );

      const res = await workspaceData.addFolder(data.id);
      if (res.code === 20000) {
        actionsVisible.value = false;
        const sameId = originalExpandedKeys.find((e) => e === data.tabKey);
        if (!sameId) {
          originalExpandedKeys.push(data.tabKey);
          expandedKeys.value = originalExpandedKeys;
        }

        res.data.tabType = TypeEnum.folder.name;
        // res.data.tabKey = res.data.id;
        openTab(res.data);
        openNotification("success", "Create folder successfully.");
      } else {
        openNotification("success", res.message);
      }
    });

    const addRequest = Helper.throttle(async (data) => {
      const originalExpandedKeys = JSON.parse(
        JSON.stringify(expandedKeys.value)
      );

      const res = await workspaceData.addRequest(data.id);

      if (res.code === 20000) {
        actionsVisible.value = false;
        const sameId = originalExpandedKeys.find((e) => e === data.tabKey);
        if (!sameId) {
          originalExpandedKeys.push(data.tabKey);
          expandedKeys.value = originalExpandedKeys;
        }
        res.data.tabType = TypeEnum.item.name;
        // res.data.tabKey = res.data.id;
        openTab(res.data);
        openNotification("success", "Create request successfully.");
      } else {
        openNotification("success", res.message);
      }
    });

    const selectedKey = ref(null);
    const openList = (data) => {
      selectedKey.value = data.tabKey;
      selectedData.value = data;
      actionsVisible.value = true;
      document.onkeydown = keyFunc;
    };

    const getPopupContainer = (trigger) => {
      // return trigger.parentNode;
      return document.getElementById(`${selectedKey.value}`);
    };

    const isShowRenameInput = ref(false);
    const handleEdit = (data) => {
      selectedKey.value = data.tabKey;
      // selectedKey.value = data.tabKey
      $bus.emit("handleTabAddAndFocused", data);
      actionsVisible.value = false;
    };

    const rename = (data) => {
      selectedKey.value = selectedData.value.tabKey;
      isShowRenameInput.value = true;
    };

    const onBlur = async (node) => {
      let res = {};
      if (node.tabType === TypeEnum.example.name) {
        const result = tabsData.getCurrentItemData(
          tempTreeData.value,
          node.requestId
        );
        // const result = tabsData.getCurrentItemData(
        //   data.treeData,
        //   node.requestId
        // );
        const resIndex = result.response.findIndex((e) => e.id === node.id);
        result.response[resIndex].name = node.name;
        const obj = {
          itemsId: result.id,
          workspaceId: workspaceData.workspace.workspaceId,
          response: result.response,
        };

        res = await editItem(obj);
      } else {
        res = await tabsData.editSidebarItemName(node);
      }

      if (res.code === 20000) {
        const pane = tabsData.tabInfo.tabsPane.find(
          (tab) => tab.id === node.id && tab.type === node.type
        );
        if (pane) {
          pane.name = node.name;
          store.commit("UPDATE_TAB", pane);

          // 比較 tab 編輯前/後狀態時，isEditing、isPin、responseBoxWidth、responseBoxHeight 需移除
          const {
            isEditing,
            isPin,
            responseBoxWidth,
            responseBoxHeight,
            ...rest
          } = pane;

          // 更新 originalTab 物件，以利後續判斷 tab 編輯狀態
          tabsData.tabInfo.originalTab = JSON.parse(JSON.stringify(rest));
        }
        openNotification("success", "Rename successfully.");
      } else {
        openNotification("success", res.message);
      }

      isShowRenameInput.value = false;
      isDraggable.value = true; // input消失後，加回tree拖曳功能
    };

    const renameInputRef = ref();

    const inputPressEnter = (node) => {
      renameInputRef.value.blur();
    };

    // 刪除資料相關參數及func
    const isShowTipDialog = ref(false);
    const selectedData = ref({});
    const openTipDialog = (node) => {
      if (JSON.stringify(node) === "{}") {
        return;
      }
      selectedData.value = node;
      actionsVisible.value = false;
      isShowTipDialog.value = true;
    };

    const openTab = (node) => {
      console.log("openTab__", node);
      selectedData.value = node;
      store.commit("SET_TREE_SELECTED_TAB", node);

      $bus.emit("handleTabAddAndFocused", node);
      document.onkeydown = keyFunc;
      if (isShowRenameInput.value) {
        isShowRenameInput.value = false;
      }
    };

    let tempTreeData = ref([]);

    // watch(
    //   () => workspaceData.workspace.isInProgress,
    //   (newVal, oldVal) => {
    //     if (!workspaceData.workspace.isInProgress) {
    //       nextTick(() => {});
    //     }
    //   },
    //   {
    //     immediate: true,
    //   }
    // );

    /**
     * 用於判斷拖曳目標值的前/後項目種類
     * @param {Array} list - 樹狀資料
     * @param {Number} targetId - 目標值ID
     */
    const nextTypeInfo = reactive({});
    const checkNextItemType = (list, targetId) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === targetId) {
          nextTypeInfo.targetType = list[i].tabType;
          if (i !== list.length - 1) {
            nextTypeInfo.nextItemType = list[i + 1].tabType;
          }

          if (i !== 0) {
            nextTypeInfo.beforeItemType = list[i - 1].tabType;
          }
        }

        if (list[i].item && list[i].item.length > 0) {
          checkNextItemType(list[i].item, targetId);
        }
      }
    };

    /**
     * dragNode 拖動的值
     * dropNode 拖入的值 (目的地)
     */
    const onDrop = async (info) => {
      nextTypeInfo.targetType = "";
      nextTypeInfo.beforeItemType = "";
      nextTypeInfo.nextItemType = "";
      let obj = {};
      let res = {};

      const dragNode = info.dragNode.dataRef;
      const dropNode = info.node.dataRef;
      const dragNodeType = dragNode.tabType;
      const dropNodeType = dropNode.tabType;

      if (
        dragNodeType === TypeEnum.collection.name ||
        dragNodeType === TypeEnum.example.name
      ) {
        // 目前尚未有拖曳response example的功能
        return;
      }
      obj.workspaceId = workspaceData.workspace.workspaceId;
      const id = dragNode.id;

      if (!info.dropToGap) {
        // 移入至目標項下
        if (dragNodeType === TypeEnum.item.name) {
          // item更換父集合
          if (dropNodeType === TypeEnum.item.name) {
            // item不能放置item項下
            return;
          }
          if (
            (dropNodeType === TypeEnum.folder.name ||
              dropNodeType === TypeEnum.collection.name) &&
            dropNode.id === dragNode.parentId
          ) {
            return;
          } // 移入原本父層之下
          obj.itemsId = id;
          obj.parentId = dropNode.id;
          expandedKeys.value.push(dropNode.id);
          autoExpandParent.value = true;
          res = await moveItem(obj);
        } else {
          // folder更換父集合
          if (dropNodeType === TypeEnum.item.name) {
            // folder不能放置item項下
            return;
          }
          if (
            dropNodeType === TypeEnum.folder.name &&
            dropNode.id === dragNode.parentId
          ) {
            return;
          } // 移入原本父層之下
          obj.folderId = id;
          obj.parentId = dropNode.id;
          expandedKeys.value.push(dropNode.id);
          autoExpandParent.value = true;
          res = await moveFolder(obj);
        }
      } else {
        // 移至項目與項目之間 (更換position)
        if (dragNodeType === TypeEnum.item.name) {
          // 移動的項目為item
          obj.itemsId = id;
          checkNextItemType(tempTreeData.value, dropNode.id);
          // checkNextItemType(data.treeData, dropNode.id);
          // 設定position 的值
          if (dropNode.index < info.dropPosition) {
            // 表示要移入目標物之後
            if (dropNodeType === TypeEnum.collection.name) {
              return;
            }
            if (dropNodeType === TypeEnum.folder.name) {
              // if (nextTypeInfo.nextItemType === 'folder') { return } // 移入folder與folder之間
              if (nextTypeInfo.nextItemType === TypeEnum.item.name) {
                // 移入同層的folder與item之間
                obj.position = 1;
                obj.parentId = dropNode.parentId;
                res = await moveItem(obj);
              } else {
                if (nextTypeInfo.beforeItemType === TypeEnum.folder.name) {
                  // 表示移入兩個 folder之間
                  if (nextTypeInfo.nextItemType === TypeEnum.folder.name) {
                    return;
                  }

                  if (!nextTypeInfo.nextItemType) {
                    // 表示移入最後一個 folder 之後，不帶 position 預設放最後一位
                    // obj.position = dropNode.position;
                    obj.parentId = dropNode.parentId;
                    res = await moveItem(obj);
                  }
                }
              }
            } else {
              obj.parentId = dropNode.parentId;
              if (dropNode.position > dragNode.position) {
                // 拖曳軌跡是往下
                obj.position = dropNode.position;
              } else {
                obj.position = dropNode.position + 1;
              }
              res = await moveItem(obj);
            }
          } else {
            // 表示要移入該項目之前
            if (
              dropNodeType === TypeEnum.collection.name ||
              dropNodeType === TypeEnum.folder.name
            ) {
              return;
            }
            obj.position = dropNode.position; // (相當於取代它的position)
            obj.parentId = dropNode.parentId;
            res = await moveItem(obj);
          }
        } else {
          // 移動的項目為folder
          obj.folderId = id;
          checkNextItemType(tempTreeData.value, dropNode.id);
          // checkNextItemType(data.treeData, dropNode.id);
          if (dropNode.index < info.dropPosition) {
            // 表示要移入目標物之後
            if (
              dropNodeType === TypeEnum.item.name ||
              dropNodeType === TypeEnum.collection.name
            ) {
              return;
            }
            obj.parentId = dropNode.parentId;
            if (dropNode.position > dragNode.position) {
              // 拖曳軌跡是往下
              obj.position = dropNode.position;
            } else {
              obj.position = dropNode.position + 1;
            }
            res = await moveFolder(obj);
          } else {
            // 表示要塞在目標物之前
            if (dropNodeType === TypeEnum.collection.name) {
              return;
            } // 表示要移入collection之上
            if (dropNodeType === TypeEnum.item.name) {
              if (nextTypeInfo.beforeItemType === TypeEnum.item.name) {
                // 表示要移入兩個item 之間
                return;
              }
              if (nextTypeInfo.beforeItemType === TypeEnum.folder.name) {
                // 表示要移入folder 與 item 之間
                obj.position = dropNode.index + 1;
              }
            } else {
              obj.position = dropNode.position;
            }
            obj.parentId = dropNode.parentId;
            res = await moveFolder(obj);
          }
        }
      }
      if (res.code === 20000) {
        autoExpandParent.value = false;
        obj = {};
        openNotification("success", `move ${dragNodeType} successfully.`);
      } else {
        openNotification("success", res.message);
      }
    };

    const openNotification = (type, message) => {
      window.showNotification(type, message);
    };

    const onClickOutside = (event) => {
      // console.log('Clicked outside. Event: ', event)
      actionsVisible.value = false;
    };

    const showTip = ref(false);

    /**
     * @description 批次展開樹節點
     * @param num 有多少節點需要展開
     * @param index 將節點依次展開
     * @param ids 需要展開的節點id集合
     */

    const spread = (num, index = 0, ids = []) => {
      const keys = [];
      for (let i = 0; i < 50; i++) {
        if (num <= 0) {
          break;
        }
        num -= 1;
        index += 1;
        keys.push(ids[index]);
      }
      if (num > 0) {
        setTimeout(() => {
          return spread(num, index, ids);
        }, 1000);
      }

      expandedKeys.value = [...expandedKeys.value, ...keys];
    };

    watch(
      () => store.getters.getSelectedWorkspaceId,
      (newVal, oldVal) => {
        expandedKeys.value = store.getters.getTreesExpendedKeys;
        selectedData.value = store.getters.getTreesSelectedTab;
      },
      {
        immediate: true,
        // deep: true,
      }
    );

    // 監聽右邊區塊選取的tab，對應 sidebar 資料節點的 selected 狀態
    watch(
      () => tabsData.tabInfo.currentTabId,
      (newVal, oldVal) => {
        const result = tabsData.tabInfo.tabsPane.find(
          (e) => e.id === tabsData.tabInfo.currentTabId
        );
        selectedData.value = result || {};
      },
      {
        immediate: true,
        // deep: true,
      }
    );

    // export collection 彈窗部分
    const isShowExportDialog = ref(false);

    const openExportDialog = (data) => {
      selectedData.value = data;
      actionsVisible.value = false;
      isShowExportDialog.value = true;
    };

    onMounted(() => {
      if (
        !workspaceData.workspace.item ||
        workspaceData.workspace.item.length === 0
      ) {
        return;
      }
    });

    if (app) {
      $bus.on("addCollection", () => {
        addCollection();
      });
    }

    onBeforeUnmount(() => {
      $bus.off("addCollection");
    });

    const duplicate = Helper.throttle(async (node) => {
      let res = {};
      const obj = {
        originalWorkspaceId: workspaceData.workspace.workspaceId,
        workspaceId: workspaceData.workspace.workspaceId,
        collectionsId: node.id,
      };

      if (node.tabType === TypeEnum.collection.name) {
        res = await copyCollection(obj);
      } else if (node.tabType === TypeEnum.folder.name) {
        res = await copyFolder(obj);
      } else if (node.tabType === TypeEnum.item.name) {
        res = await copyItem(obj);
      } else {
        res = await duplicateResponseExample(node);
      }

      if (res.code === 20000) {
        if (Array.isArray(res.data)) {
          res.data[0].tabType = node.tabType;
          res.data[0].tabKey = res.data[0].id;
          openTab(res.data[0]);
        } else {
          res.data.tabType = node.tabType;
          if (res.data.tabType !== TypeEnum.example.name) {
            // response-example 的tabKey於duplicateResponseExample定義
            // res.data.tabKey = res.data.id;
          }
          openTab(res.data);
          openNotification(
            "success",
            `Duplicate ${node.tabType} successfully.`
          );
        }
      } else {
        openNotification("success", res.message);
      }
    });

    const keyFunc = () => {
      if (event.keyCode === 69 && event.ctrlKey) {
        // show rename input by "ctrl + E"
        event.preventDefault();
        rename();
        onClickOutside();
      } else if (event.keyCode === 46) {
        // del by "Delete"
        if (isShowRenameInput.value) {
          return;
        }
        event.preventDefault();
        openTipDialog(selectedData.value);
        onClickOutside();
      } else if (event.keyCode === 68 && event.ctrlKey) {
        // duplicate by "ctrl + D"
        event.preventDefault();
        duplicate(selectedData.value);
        onClickOutside();
      }
    };

    const isDraggable = ref(true);

    const handleMousedown = () => {
      if (isShowRenameInput.value) {
        isDraggable.value = false;
      }
    };

    const duplicateResponseExample = async (node) => {
      const tempNode = JSON.parse(JSON.stringify(node));
      const targetItemData = tabsData.getCurrentItemData(
        workspaceData.workspace.item,
        node.requestId
      ); // 複製前：從sidebar找該response對應的request Data

      if (targetItemData) {
        tempNode.id = Date.now();
        targetItemData.response.push(tempNode);
      }

      // 複製request response 其中的項目，因此call editItem IPC
      const obj = {
        itemsId: targetItemData.id,
        workspaceId: workspaceData.workspace.workspaceId,
        response: targetItemData.response,
      };
      // 複製一份call editItem IPC 的 response資料，並將裡面的data資料換成複製過後的response-example資料
      const res = await editItem(obj);
      const tempRes = JSON.parse(JSON.stringify(res));
      const currentRequestData = tabsData.getCurrentItemData(
        workspaceData.workspace.item,
        node.requestId
      ); // 複製後：從sidebar找該response對應的request Data
      const currentResExample = tempRes.data.response.find(
        (e) => e.id === tempNode.id
      ); // 確認sidebar否已新增該筆資料
      if (currentResExample) {
        const resExample = tempRes.data.response.find(
          (e) => e.id === tempNode.id
        ); // 從API回傳資料取得該resExample資料
        const resExampleIndex = tempRes.data.response.findIndex(
          (e) => e.id === tempNode.id
        ); // 從API回傳資料取得該resExample資料index，用於定義tabKey
        if (resExample) {
          resExample.requestId = node.requestId;
          resExample.tabType = TypeEnum.example.name;
          resExample.workspaceId = workspaceData.workspace.workspaceId;
          resExample.tabKey = `${currentRequestData.tabKey}-${resExampleIndex}`;
          delete tempRes.data;
          tempRes.data = resExample;
        }
      }

      return tempRes;
    };

    const barOptions = ref([
      {
        label: "Edit",
        type: "edit",
        function: (node) => {
          handleEdit(node);
        },
        isShow: (node) => {
          return node.item && node.item.length >= 0;
        },
      },
      {
        label: "Add Folder",
        type: "add",
        function: (dataRef) => {
          addFolder(dataRef);
        },
        isShow: (item) => {
          return item.item && item.item.length >= 0;
        },
      },
      {
        label: "Add Request",
        type: "add",
        function: (dataRef) => {
          addRequest(dataRef);
        },
        isShow: (item) => {
          return item.item && item.item.length >= 0;
        },
      },
      {
        label: "Rename",
        type: "rename",
        function: (dataRef) => {
          rename(dataRef);
        },
        hotKey: "Ctrl+E",
        isShow: (item) => {
          return true;
        },
      },
      {
        label: "Duplicate",
        type: "duplicate",
        function: (dataRef) => {
          duplicate(dataRef);
        },
        hotKey: "Ctrl+D",
        isShow: (item) => {
          return true;
        },
      },
      {
        label: "Export",
        type: "export",
        function: (dataRef) => {
          openExportDialog(dataRef);
        },
        isShow: (item) => {
          return item.parentId === -1;
        },
      },
      {
        label: "Delete",
        type: "delete",
        function: (dataRef) => {
          openTipDialog(dataRef);
        },
        hotKey: "Del",
        isShow: (item) => {
          return true;
        },
      },
    ]);

    /**
     * @param {String} tabKey - 作為tab列表的key，避免id為null的狀況
     */
    const getNewTree = (tree, pos) => {
      const posStr = `${pos}`;

      return tree.map((node, i) => {
        const index = i;
        const tabType = classifyType(node);
        const tabKey = `${posStr}-${index}`;

        // 创建一个新的节点对象，包括原来的属性和新的key属性
        const newNode = {
          ...node,

          index,
          tabType,
          tabKey,
        };

        // 如果节点有子节点，递归调用addKeyToTree来为子节点添加key属性
        if (newNode.item && newNode.item.length > 0) {
          newNode.item = getNewTree(newNode.item, tabKey);
        } else if (newNode.response && newNode.response.length > 0) {
          newNode.item = newNode.response;

          newNode.item.forEach((e, index) => {
            if (e) {
              e.requestId = newNode.id;
              e.workspaceId = workspaceData.workspace.workspaceId;
              e.tabKey = `${newNode.tabKey}-${index}`;
              e.tabType = classifyType(e);
            }
          });
        }

        return newNode;
      });
    };

    // 將樹狀數據扁平化
    const flatList = ref([]);
    const generateList = (treeData) => {
      // flatList.value = [];
      for (let i = 0; i < treeData.length; i++) {
        const node = treeData[i];
        flatList.value.push({
          ...node,
        });
        if (node.item) {
          generateList(node.item);
        }
      }
    };

    const keywordSearch = (keyword) => {
      if (!keyword) {
        expandedKeys.value = [];
        tempTreeData.value = originTreeData.value;
        return;
      }

      console.time();
      new Promise((resolve) => {
        const filterResult = filterTree(tempTreeData.value, keyword);
        // console.log("filterResult__", filterResult);
        if (filterResult.length === 0) {
          showTip.value = true;
          return;
        }

        tempTreeData.value = filterResult;
        const ids = findParentIds(filterResult);
        // console.log(ids);
        // spread(ids.length, 0, ids);

        expandedKeys.value = findParentIds(filterResult);
        resolve();
      }).then(async () => {
        await nextTick();
        console.timeEnd();
      });
    };

    const findParentIds = (treeData, parentId = -1, result = []) => {
      for (const node of treeData) {
        if (node.parentId === parentId) {
          result.push(node.id);
          if (node.item) {
            findParentIds(node.item, node.id, result);
          }
        }
      }
      return result;
    };

    const filterTree = (tree, keyword) => {
      const checkChildren = (result, node) => {
        if (node.name.includes(keyword)) {
          result.push(node);
          return result;
        }

        if (node.item && node.item.length) {
          const item = node.item.reduce(checkChildren, []);

          if (item.length) {
            result.push({ ...node, item });
          }
        }

        return result;
      };

      return tree.reduce(checkChildren, []);
    };

    const virtualHeight = ref(null);

    watch(
      () => workspaceData.workspace.item,
      async (newVal, oldVal) => {
        // console.log("workspaceData.workspace.item change");
        // console.log("newVal, oldVal__", newVal, oldVal);

        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          tempTreeData.value = await getNewTree(newVal, 0);
          // console.log("tempTreeData.value__", tempTreeData.value);
          originTreeData.value = JSON.parse(JSON.stringify(tempTreeData.value));
          flatList.value = [];
          // generateList(tempTreeData.value);
          nextTick(() => {
            const treeWrapper = document.getElementById("sidebar-tree-wrapper");
            const operationEl = document.getElementsByClassName(
              "sidebar-tree__operation"
            )[0];
            if (treeWrapper && operationEl) {
              virtualHeight.value =
                treeWrapper.clientHeight - operationEl.clientHeight - 7;
            }
          });
          console.log(JSON.parse(JSON.stringify(newVal)));
        }
      },
      {
        immediate: true,
      }
    );

    return {
      renameInputRef,
      inputPressEnter,
      virtualHeight,
      replaceFields,
      workspaceData,
      data,
      addCollection,
      addFolder,
      actionsVisible,
      openList,
      selectedKey,
      addRequest,
      handleEdit,
      openTipDialog,
      isShowTipDialog,
      selectedData,
      isShowRenameInput,
      onBlur,
      openTab,
      onExpand,
      autoExpandParent,
      expandedKeys,
      onDrop,
      onClickOutside,
      originTreeData,
      checkNextItemType,
      nextTypeInfo,
      showTip,
      user,
      isShowExportDialog,
      openExportDialog,
      rename,
      TypeEnum,
      duplicate,
      tabsData,
      isDraggable,
      handleMousedown,
      tempTreeData,
      barOptions,
      keywordSearch,
      getPopupContainer,
    };
  },
  directives: {
    focus,
  },
};
</script>
<style lang="scss" scoped>
$operation-height: 34px;
$operation-margin: 5px;
$sidebar-trigger-height: 40px;

#sidebar-tree-wrapper {
  height: 100%;
  padding-left: 8px;
  outline: none;
}

.sidebar-tree {
  height: calc(100% - #{$operation-height});

  &__operation {
    // height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  .ant-tree {
    height: calc(100% - #{$operation-height} - #{$operation-margin});
    // height: calc(100% - #{$operation-height} - #{$sidebar-trigger-height});
    overflow: auto;
  }
}

.empty-block-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.empty-block {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  padding: 0 10px;
  text-align: center;
  transform: translate(-50%, -50%);

  &__header {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  &__button {
    margin-top: 14px;

    &:deep(.ant-btn) {
      background-color: transparent;

      &:hover {
        background-color: $primary-blue;

        .anticon {
          color: #fff;
        }
      }
    }
  }

  &__content {
    color: #666;
  }
}

.tree-view-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 5px;
}

.tree-view-left {
  flex: 1;
  overflow: hidden;
}

.node-box {
  display: flex;
  align-items: center;

  &__icon {
    width: 20px;
    margin-right: 5px;
  }

  &__name-wrapper {
    max-width: 170px;
    max-height: 24px;
    // margin-right: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.btn-popup {
  border-color: transparent;
  background: transparent;

  &:hover {
    border-color: transparent;
    background: transparent;
  }
}

.tree-view-right {
  width: 24px;
  height: 24px;
}

.action-list {
  padding: 0;
  list-style: unset;

  li {
    padding: 0 4px;
    height: 32px;
    line-height: 32px;
    cursor: pointer;

    &:hover {
      background-color: #e5e5e5;
    }

    &.delete {
      &:hover {
        background-color: #ef4545;

        .actions-item--delete,
        .hot-key {
          color: #fff;
        }
      }
    }
  }
}

.actions-item {
  display: flex;
  color: #333;

  &--delete {
    color: #ff5151;
  }
}

.hot-key {
  margin-left: auto;
  color: #767676;
}

.name-icon {
  margin-right: 8px;
}

.edit-input {
  height: 100%;
  padding: 1px 10px;
  line-height: unset;
}

.item-name {
  p {
    margin-right: 16px;
    margin-bottom: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.folder-name {
  display: flex;
  margin-right: 16px;

  .icon {
    width: 20px;
    margin-right: 5px;
  }

  .name {
    text-overflow: ellipsis;
    overflow-x: hidden;
  }
}

.method-label {
  margin-right: 8px;
  font-size: $text-size-xxs;
  font-weight: 700;
}

.tip-text {
  margin-top: 16px;
  text-align: center;
  font-weight: 600;
}

.icon-list {
  width: 100%;
  height: 100%;
  display: block;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("~@/assets/img/sidebar/icon-list.png");
  transform: scale(0.8);

  &:hover {
    background-position: center center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/sidebar/icon-list-hoverd.png");
  }
}
</style>

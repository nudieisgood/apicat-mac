<template>
  <div id="sidebar-tree-wrapper">
    <div class="sidebar-tree__operation">
      <action-menu
        @create="addCollection"
        @search="onSearch"
        :current-tab-name="'Collection'"
      />
    </div>
    <div
      class="sidebar-tree"
      v-if="
        workspaceData.workspace.item && workspaceData.workspace.item.length > 0
      "
    >
      <!-- <base-tree
        ref="tree"
        v-model="tempTreeData"
        :children-key="`item`"
        :node-key="`tabKey`"
        :text-key="`name`"
        :default-open="false"
        virtualization
        style="height: 100%"
        :rootDroppable="false"
      >
        <template #default="{ node, stat }" ref="node" @open="open">
          <div class="tree-view-item">
            <div class="tree-view-left">
              <div class="node-box" @click.stop="openTab(node)">
                <div
                  class="node-box__expend"
                  v-if="node.item && node.item.length"
                  @click.stop="stat.open = !stat.open"
                >
                  <span v-if="node.item.length">
                    <caret-down-outlined v-if="stat.open" />
                    <caret-right-outlined v-else />
                  </span>
                </div>
                <span
                  class="node-box__icon"
                  v-if="node.tabType === TypeEnum.folder.name"
                  ><folder-outlined
                /></span>

                <span
                  class="node-box__icon"
                  v-else-if="node.tabType === TypeEnum.example.name"
                >
                  <img :src="require('@/assets/img/icon-example.png')" alt="" />
                </span>
                <div
                  class="node-box__request-method method-label"
                  v-if="node.request"
                  :class="tabsData.classifyMethodColor(node.request.method)"
                >
                  {{ node.request.method }}
                </div>
                <div class="node-box__name-wrapper">
                  <a-input
                    v-if="isShowRenameInput && node.posKey === selectedKey"
                    v-model:value="node.name"
                    @blur="onBlur(node)"
                    class="edit-input"
                    @keyup.enter="onBlur(node)"
                    @mousedown="handleMousedown"
                    @click.stop
                    v-focus
                  />
                  <span v-else class="node-box__name">{{ node.name }}</span>
                </div>
              </div>
            </div>
            <div class="tree-view-right" v-if="user.userInfo.isEditable">
              <a-popover
                trigger="click"
                :getPopupContainer="(trigger) => trigger.parentNode"
                placement="bottomRight"
                :visible="node.posKey === selectedData.posKey && actionsVisible"
                overlayClassName="action-list-overlay"
              >
                <template #content>
                  <ul class="action-list">
                    <template
                      v-for="(option, index) in barOptions"
                      :key="index"
                    >
                      <li
                        v-if="option.isShow(node)"
                        @click="option.function(node, stat)"
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
                  @click.stop="openList(node)"
                  v-click-outside="onClickOutside"
                >
                </span>
              </a-popover>
            </div>
          </div>
        </template>
      </base-tree> -->
      <Draggable
        ref="tree"
        v-model="tempTreeData"
        :children-key="`item`"
        :node-key="`tabKey`"
        :text-key="`name`"
        virtualization
        style="height: 100%"
        :default-open="true"
        :each-droppable="eachDroppable"
        :each-draggable="eachDraggable"
        @after-drop="onAfterDrop"
        :disable-drop="isDisableDrop"
        :disable-drag="isDisableDrag"
        @before-drop="beforeDrop"
        :onDrag="onDrag"
        :rootDroppable="false"
      >
        <template #default="{ node, stat }">
          <div class="tree-view-item">
            <div class="tree-view-left">
              <div class="node-box" @click.stop="openTab(node)">
                <div
                  class="node-box__expend"
                  v-if="node.item"
                  @click.stop="stat.open = !stat.open"
                >
                  <span v-if="node.item.length">
                    <caret-down-outlined v-if="stat.open" />
                    <caret-right-outlined v-else />
                  </span>
                </div>
                <span
                  class="node-box__icon"
                  v-if="node.tabType === TypeEnum.folder.name"
                  ><folder-outlined
                /></span>

                <span
                  class="node-box__icon"
                  v-else-if="node.tabType === TypeEnum.example.name"
                >
                  <img :src="require('@/assets/img/icon-example.png')" alt="" />
                </span>
                <div
                  class="node-box__request-method method-label"
                  v-if="node.request"
                  :class="tabsData.classifyMethodColor(node.request.method)"
                >
                  {{ node.request.method }}
                </div>
                <div class="node-box__name-wrapper">
                  <a-input
                    v-if="isShowRenameInput && node.posKey === selectedKey"
                    v-model:value="node.name"
                    @blur="onBlur(node)"
                    class="edit-input"
                    @keyup.enter="onBlur(node)"
                    @mousedown="handleMousedown"
                    @click.stop
                    v-focus
                  />
                  <span v-else class="node-box__name">{{ node.name }}</span>
                </div>
              </div>
            </div>
            <div class="tree-view-right" v-if="user.userInfo.isEditable">
              <a-popover
                trigger="click"
                :getPopupContainer="(trigger) => trigger.parentNode"
                placement="bottomRight"
                :visible="node.posKey === selectedData.posKey && actionsVisible"
                overlayClassName="action-list-overlay"
              >
                <template #content>
                  <ul class="action-list">
                    <template
                      v-for="(option, index) in barOptions"
                      :key="index"
                    >
                      <li
                        v-if="option.isShow(node)"
                        @click="option.function(node)"
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
                  @click.stop="openList(node)"
                  v-click-outside="onClickOutside"
                >
                </span>
              </a-popover>
            </div>
          </div>
        </template>
      </Draggable>
    </div>
  </div>
  <export-dialog
    v-if="isShowExportDialog"
    :dialogVisible="isShowExportDialog"
    @close-export-dialog="isShowExportDialog = false"
    :collection-Info="selectedData"
  />
  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="isShowTipDialog = false"
    :deleted-data="selectedData"
    :tree-data="tempTreeData"
  />
</template>

<script>
// import {
//   Tree,
//   BaseTree,
//   Draggable,
//   dragContext,
//   isNodeDroppable,
//   $droppable,
// } from "he-tree-vue";
// import "he-tree-vue/dist/he-tree-vue.css";
import {
  BaseTree,
  Draggable,
  dragContext,
  isNodeDroppable,
  $droppable,
} from "@he-tree/vue";
import "@he-tree/vue/style/default.css";
import { watch, getCurrentInstance, ref, nextTick, inject } from "vue";
import workspaceData from "@/store/workspace";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import tabsData from "@/store/tabs";
import ActionMenu from "@/components/Sidebar/actionMenu.vue";
import Helper from "@/js/utils/helper";
import user from "@/store/user";
import ExportDialog from "@/components/Sidebar/exportDialog.vue";
import TipDialog from "@/components/TipDialog";
import { createCollection, copyCollection } from "@/js/ipc/collectionIPC.js";
import { createFolder, moveFolder, copyFolder } from "@/js/ipc/folderIPC.js";
import { createItem, moveItem, editItem, copyItem } from "@/js/ipc/itemIPC.js";
import { useStore } from "vuex";

const focus = {
  mounted(el) {
    el.focus();
  },
};

export default {
  components: {
    ActionMenu,
    ExportDialog,
    TipDialog,
    // BaseTree,
    Draggable,
  },
  // components: { Draggable, ActionMenu, ExportDialog, TipDialog },
  setup() {
    const $bus = inject("$bus");
    const $message = inject("$message");
    const internalInstance = getCurrentInstance();
    const notification =
      internalInstance.appContext.config.globalProperties.$notification;
    const store = useStore();
    const tree = ref();
    const flatList = ref([]);
    const originTreeData = ref([]);
    let tempTreeData = ref([]);
    const getNewTree = (tree, pos) => {
      const posStr = `${pos}`;
      const obj = {
        title: "custom",
        icon: "folder",
      };
      return tree.map((node, i) => {
        const index = i;
        const isMatch = false;
        const tabType = classifyType(node);
        const posKey = `${posStr}-${index}`;
        const slots = obj;
        // const name = node.name;
        // const id = node.id;
        // const item = node.item;
        let tabKey;
        // console.log(tabType);

        if (tabType === TypeEnum.example.name) {
          tabKey = node.posKey;
        } else {
          tabKey = node.id;
        }

        // 创建一个新的节点对象，包括原来的属性和新的key属性
        const newNode = {
          ...node,
          // item,
          // name,
          // id,
          index,
          isMatch,
          tabType,
          tabKey,
          posKey,
          slots,
        };

        // 如果节点有子节点，递归调用addKeyToTree来为子节点添加key属性
        if (newNode.item && newNode.item.length > 0) {
          newNode.item = getNewTree(newNode.item, posKey);
        } else if (newNode.response && newNode.response.length > 0) {
          newNode.item = newNode.response;

          newNode.item.forEach((e, index) => {
            if (e) {
              e.isMatch = false;
              e.requestId = newNode.id;
              e.workspaceId = workspaceData.workspace.workspaceId;
              e.posKey = `${newNode.posKey}-${index}`;
              e.tabKey = e.posKey;
              e.tabType = classifyType(e);
            }
          });
        }

        return newNode;
      });
    };
    const generateList = (treeData) => {
      // flatList.value = [];
      for (let i = 0; i < treeData.length; i++) {
        const node = treeData[i];
        const name = node.name;
        const id = node.id;
        const parentId = node.parentId;
        flatList.value.push({
          name,
          id,
          parentId,
        });
        if (node.item) {
          generateList(node.item);
        }
      }
    };
    const node = ref();
    watch(
      () => workspaceData.workspace.item,
      async (newVal, oldVal) => {
        console.log("workspaceData.workspace.item change");

        // console.log("newVal, oldVal__", newVal, oldVal);
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          tempTreeData.value = await getNewTree(newVal, 0);
          originTreeData.value = JSON.parse(JSON.stringify(tempTreeData.value));
          flatList.value = [];
          generateList(tempTreeData.value);
          console.log("tree ref__", tree.value);
          console.log("currentStat.value __", currentStat.value);
          setTimeout(() => {
            currentStat.value.open = true;
          }, 3000);
          console.log("node__", node.value);

          // console.log(
          //   "treeDraggableInstance__",
          //   tree.value.treeDraggableInstance
          // );

          tree.value.treeDraggableInstance.onDragEnter = dragEnter;
          // tree.value.treeDraggableInstance.onDragEnter = (targetStat) => {
          //   console.log("yo");

          //   console.log(dragContext.targetInfo);
          //   console.log("targetStat__", targetStat);
          //   console.log(targetStat.target);
          //   if (targetStat.target) {
          //     console.log(
          //       "targetStat__",
          //       tree.value.getNodeByElement(targetStat.path[6])
          //     );
          //     const targetNode = tree.value.getNodeByElement(
          //       targetStat.path[6]
          //     );
          //     if (targetNode) {
          //       console.log("targetNode__", targetNode.data);
          //     }
          //   }
          //   console.log("treeDraggableInstance__", tree.value.dragNode);
          // };

          // console.log("$droppable__", $droppable);
          // console.log("isNodeDroppable__", isNodeDroppable);
          // console.log("flatList__", flatList.value);
        }
      },
      {
        immediate: true,
      }
    );

    const addCollection = Helper.throttle(async () => {
      // console.log("add collection");
      if (!workspaceData.workspace.workspaceId) {
        $message.warning("Select a workspace!");
        return;
      }

      const res = await workspaceData.addCollection();

      if (res.code === 20000) {
        // res.data.tabType = TypeEnum.collection.name;
        // res.data.tabKey = res.data.id;
        // openTab(res.data);
        openNotificationWithIcon("success", "Create collection successfully.");
      } else {
        openNotificationWithIcon("success", res.message);
      }
    });

    const currentStat = ref({});
    const addFolder = Helper.throttle(async (node, stat) => {
      const res = await workspaceData.addFolder(node.id);
      actionsVisible.value = false;

      if (res.code === 20000) {
        // TODO: 要自動展開父節點
        console.log(node, stat);
        // stat.open = true;
        currentStat.value = { ...stat };
        // openTab(res.data);
        openNotificationWithIcon("success", "Create folder successfully.");
      } else {
        openNotificationWithIcon("success", res.message);
      }
    });

    const addRequest = Helper.throttle(async (data) => {
      // const originalExpandedKeys = JSON.parse(
      //   JSON.stringify(expandedKeys.value)
      // );
      const res = await workspaceData.addRequest(data.id);
      actionsVisible.value = false;
      if (res.code === 20000) {
        // TODO: 要自動展開父節點
        // openTab(res.data);
        openNotificationWithIcon("success", "Create request successfully.");
      } else {
        openNotificationWithIcon("success", res.message);
      }
    });

    // keyword search star
    const onSearch = (keyword) => {
      // console.log("tree ref__", tree.value);

      if (!keyword) {
        // expandedKeys.value = [];
        tempTreeData.value = originTreeData.value;
        return;
      }

      // const filterFunction = tree.value.statsFlat.filter(
      //   (item) => item.data.name.indexOf(keyword) > -1
      // );

      // const flatData = tree.value.getData(null, filterFunction);
      // console.log("flatData__", flatData);
      // const filter = (keyword) => {
      //   console.log(keyword);
      //   return tree.value.statsFlat.map((node) => {
      //     console.log(node.data.name.includes(keyword));
      //     if (node.data.name.includes(keyword)) {
      //       console.log("node__", node);
      //       return node.data;
      //     }
      //     return;
      //   });
      // };

      // console.time();
      // console.log(tree.value.getData(null, filter(keyword)));

      new Promise((resolve) => {
        const filterResult = filterTree(tempTreeData.value, keyword);
        // console.log("filterResult__", filterResult);
        if (filterResult.length === 0) {
          showTip.value = true;
          return;
        }

        tempTreeData.value = filterResult;
        resolve();
      }).then(async () => {
        await nextTick();
        tree.value.openAll();
        console.timeEnd();
      });
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
    // keyword search end

    const barOptions = ref([
      {
        label: "Edit",
        type: "edit",
        function: (dataRef) => {
          handleEdit(dataRef);
        },
        isShow: (item) => {
          return item.item && item.item.length >= 0;
        },
      },
      {
        label: "Add Folder",
        type: "add",
        function: (node, stat) => {
          console.log(node, stat);
          addFolder(node, stat);
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
    const actionsVisible = ref(false);
    const selectedData = ref({});

    const openList = (data) => {
      selectedData.value = data;
      actionsVisible.value = true;
      document.onkeydown = keyFunc;
    };

    const onClickOutside = (event) => {
      // console.log('Clicked outside. Event: ', event)
      actionsVisible.value = false;
    };

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

    const isShowRenameInput = ref(false);
    const selectedKey = ref(null);
    const rename = (node) => {
      selectedKey.value = node.posKey;
      isShowRenameInput.value = true;
      isDisableDrag.value = true;
    };

    const isDisableDrag = ref(false);

    const handleMousedown = () => {
      if (isShowRenameInput.value) {
        isDisableDrag.value = true;
      }
    };

    const onBlur = async (node) => {
      // TODO: 案enter儲存, 會觸發兩次更新 tree dom
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
        }
      }
      isShowRenameInput.value = false;
      isDisableDrag.value = false; // input消失後，加回tree拖曳功能
    };

    // export collection 彈窗部分
    const isShowExportDialog = ref(false);

    const openExportDialog = (data) => {
      selectedData.value = data;
      actionsVisible.value = false;
      isShowExportDialog.value = true;
    };

    // 刪除資料相關參數及func
    const isShowTipDialog = ref(false);
    const openTipDialog = (node) => {
      if (JSON.stringify(node) === "{}") {
        return;
      }
      selectedData.value = node;
      actionsVisible.value = false;
      isShowTipDialog.value = true;
    };

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
          // openTab(res.data[0]);
        } else {
          res.data.tabType = node.tabType;
          if (res.data.tabType !== TypeEnum.example.name) {
            // response-example 的tabKey於duplicateResponseExample定義
            res.data.tabKey = res.data.id;
          }
          // openTab(res.data);
        }
      }
    });

    const openTab = (node) => {
      selectedData.value = node;
      store.commit("SET_TREE_SELECTED_TAB", node);

      $bus.emit("handleTabAddAndFocused", node);
      document.onkeydown = keyFunc;
      if (isShowRenameInput.value) {
        isShowRenameInput.value = false;
      }
    };

    const handleEdit = (data) => {
      actionsVisible.value = false;
      selectedKey.value = data.posKey;
      // selectedKey.value = data.tabKey
      $bus.emit("handleTabAddAndFocused", data);
    };
    const dragEnter = (targetStat) => {
      // console.log("dragEnter targetStat__", targetStat);
    };
    const eachDroppable = (targetStat) => {
      const dragNode = dragContext.dragNode.data;

      // console.log(targetStat);
      if (dragNode.tabType === TypeEnum.folder.name) {
        // console.log(targetStat);
        if (targetStat.data.tabType === TypeEnum.item.name) {
          // folder不能放置item項下
          targetStat.droppable = false;
        }
      }

      if (dragNode.tabType === TypeEnum.item.name) {
        // console.log(targetStat);
        if (targetStat.data.tabType === TypeEnum.item.name) {
          // item不能放置item項下
          targetStat.droppable = false;
        }
      }
    };
    const eachDraggable = (targetStat) => {
      // console.log("eachDraggable __");
      const dragNode = targetStat.data;
      // 目前尚未有拖曳response example 及 collection 的功能
      if (
        dragNode.tabType === TypeEnum.collection.name ||
        dragNode.tabType === TypeEnum.example.name
      )
        return false;
      return true;
    };

    const isDisableDrop = ref(false);
    const onAfterDrop = async () => {
      // console.log("tree ref__", tree.value);
      console.log("dragContext __", dragContext);
      const { startInfo, targetInfo } = dragContext;
      // const startInfo = dragContext.startInfo.dragNode.data;
      console.log("startInfo__", startInfo);
      // const startParentInfo = dragContext.startInfo.parent;
      // console.log("startParentInfo__", startParentInfo);
      // const startIndex = dragContext.startInfo.indexBeforeDrop;
      // console.log("startIndex__", startIndex);
      // const targetInfo = dragContext.targetInfo.dragNode.data;
      console.log("targetInfo__", targetInfo);
      const { dragNode, parent, indexBeforeDrop } = targetInfo;
      console.log("dragNode__", dragNode);
      console.log("parent__", parent);
      console.log("indexBeforeDrop__", indexBeforeDrop);

      // const targetParentInfo = dragContext.targetInfo.parent.data;
      // console.log("targetParentInfo__", targetParentInfo);
      // console.log("targetParentId__", targetParentInfo.tabType);
      // const targetIndex = dragContext.targetInfo.indexBeforeDrop;
      // console.log("targetIndex__", targetIndex);

      let insertPosition = null;

      // 移動的是 item
      if (dragNode.data.tabType === TypeEnum.item.name) {
        if (
          indexBeforeDrop + 1 === dragNode.data.position &&
          dragNode.data.parentId === parent.data.id
        ) {
          // 表示沒做任何改變
          console.log("咦好玩的");
          return;
        }

        if (dragNode.data.parentId !== parent.data.id) {
          console.log("父層改變");
          if (indexBeforeDrop === parent.children.length) {
            insertPosition = indexBeforeDrop - 1;
          } else {
            insertPosition = indexBeforeDrop;
          }
        } else {
          console.log("父層沒變, 換個位置");
          if (indexBeforeDrop === parent.children.length) {
            insertPosition = indexBeforeDrop - 1;
          } else {
            insertPosition = indexBeforeDrop;
          }
        }
      }

      // 移動的是 folder
      if (dragNode.data.tabType === TypeEnum.folder.name) {
        if (
          indexBeforeDrop + 1 === dragNode.data.position &&
          dragNode.data.parentId === parent.data.id
        ) {
          // 表示沒做任何改變
          console.log("咦好玩的");
          return;
        }

        if (dragNode.data.parentId !== parent.data.id) {
          console.log("父層改變");
          if (indexBeforeDrop === parent.children.length) {
            insertPosition = indexBeforeDrop - 1;
          } else {
            insertPosition = indexBeforeDrop;
          }
        } else {
          console.log("父層沒變, 換個位置");
          if (indexBeforeDrop === parent.children.length) {
            insertPosition = indexBeforeDrop - 1;
          } else {
            insertPosition = indexBeforeDrop;
          }
        }
        // if (targetParentInfo.tabType === TypeEnum.item.name) {
        //   dragContext.targetInfo.parent.droppable = false;
        //   isDisableDrop.value = true;
        //   console.log("ya");
        //   console.log("isNodeDroppable__", tree.value.isDroppable);
        //   tree.value.isDroppable(dragContext.targetInfo.parent);
        //   console.log("isNodeDroppable__", tree.value.isNodeDroppable);
        //   console.log("isNodeDroppable__", tree.value.isDroppable);
        // }
      }

      console.log("test return");
      let res = null;

      const obj = {
        workspaceId: workspaceData.workspace.workspaceId,
        // parentId: targetParentInfo.id,
        parentId: parent.data.id,
        position: insertPosition,
      };
      console.log("obj__", obj);
      // if (startInfo.tabType === TypeEnum.folder.name) {
      //   obj.folderId = startInfo.id;
      // } else {
      //   obj.itemsId = startInfo.id;
      //   console.log("?");
      //   console.log("obj__", obj);
      //   // res = await moveItem(obj);
      //   // console.log("res__", res);
      // }

      // if (res.code === 20000) {
      //   console.log("update by drag");
      // }
    };

    const beforeDragOpen = () => {
      console.log("yo");
      console.log("dragContext __", dragContext);
    };

    const ondragend = () => {
      console.log("ondragend");
    };
    const onDrag = (store) => {
      // console.log("ondrag__", store);
      const targetInfo = dragContext.targetInfo;
      // console.log("targetInfo__", targetInfo);
      // isDisableDrop.value = true;

      // isDisableDrop.value = false;
    };

    const beforeDrop = () => {
      console.log("beforeDrop");
    };
    const handleDragEnter = () => {
      console.log("handleDragEnter");
      console.log("dragContext __", dragContext);
      const { startInfo, targetInfo } = dragContext;
      // const startInfo = dragContext.startInfo;
      console.log("startInfo__", startInfo);
      const dragNode = startInfo.dragNode.data;
      console.log("dragNode__", dragNode);

      // const targetInfo = dragContext.getTargetInfo();
      console.log("targetInfo__", targetInfo);

      const targetParentInfo = targetInfo.parent.data;
      // console.log("targetParentInfo__", targetParentInfo);

      if (startInfo.type === TypeEnum.folder.name) {
        if (targetParentInfo.type === TypeEnum.item.name) {
          console.log("yoooo");
          isDisableDrop.value = true;
        }
      }
    };
    // const handleDragEnter = (event, node) => {
    //   console.log("handleDragEnter");
    //   // 在拖动节点进入目标节点时记录目标节点
    //   console.log("event__", event);
    //   console.log("node__", node);
    // };

    const isNodeDroppable = () => {
      console.log("isNodeDroppable");
    };

    const onDragEnter = () => {
      console.log("onDragEnter__", dragContext);
    };

    const open = (node) => {
      console.log("node__", node);
    };

    const openNotificationWithIcon = (type, message) => {
      notification[type]({
        message: message,
        // description:`Cookies for domain ${domainName} deleted successfully.`
        placement: "bottomRight",
        duration: 2.5,
      });
    };

    return {
      open,
      onDragEnter,
      isNodeDroppable,
      dragEnter,
      ondragend,
      onDrag,
      beforeDrop,
      handleDragEnter,
      tempTreeData,
      workspaceData,
      TypeEnum,
      tabsData,
      addCollection,
      onSearch,
      tree,
      barOptions,
      user,
      openList,
      selectedData,
      actionsVisible,
      onClickOutside,
      addFolder,
      onBlur,
      isDisableDrag,
      handleMousedown,
      isShowRenameInput,
      rename,
      selectedKey,
      isShowExportDialog,
      openExportDialog,
      isShowTipDialog,
      openTipDialog,
      openTab,
      handleEdit,
      eachDroppable,
      onAfterDrop,
      eachDraggable,
      isDisableDrop,
      beforeDragOpen,
      node,
    };
  },
  directives: {
    focus,
  },
};
</script>

<style scoped lang="scss">
$operation-height: 32px;
$operation-margin: 8px;
$sidebar-trigger-height: 40px;

#sidebar-tree-wrapper {
  height: 100%;
  outline: none;
}

.sidebar-tree {
  height: 100%;

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
  height: 30px;
  padding: 0 5px;

  &--active {
    background-color: $secondary-light-grey;
  }
}

.tree-view-left {
  flex: 1;
  overflow: hidden;
}

.node-box {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  // gap: 10px;
  cursor: pointer;
  &__name-wrapper {
    max-height: 20px;
    margin-right: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__expend {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 10px;
  }

  &__icon {
    padding-right: 10px;
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
  cursor: pointer;

  &:deep(.action-list-overlay) {
    min-width: 200px;
  }
}

.action-list {
  padding: 0;
  list-style: none;

  li {
    height: 32px;
    line-height: 32px;
    cursor: pointer;
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

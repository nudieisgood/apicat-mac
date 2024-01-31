<template>
  <a-modal
    v-model:open="visible"
    title="SAVE REQUEST"
    class="save-request-modal"
    width="450px"
    @cancel="closeDialog"
    @ok="onSave"
    okText="Save"
    :ok-button-props="{ disabled: !formState.requestName || !selectedInfo.id }"
  >
    <div class="save-request-modal-container">
      <div class="name-row row">
        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
        >
          <a-form-item
            label="Request name"
            ref="requestName"
            name="requestName"
          >
            <a-input v-model:value="formState.requestName" />
          </a-form-item>
        </a-form>
      </div>
      <div class="path-row row">
        Save to
        <span class="selected-info">
          <span v-if="!selectedInfo.name">Select a collection / folder</span>
          <span v-else class="selected-info__name">{{
            selectedInfo.name
          }}</span>
        </span>
      </div>
      <div class="selector-row row">
        <div class="collection-explorer">
          <div class="explorer">
            <div class="search-row row">
              <a-tooltip placement="bottom">
                <template #title>
                  <span>Create new Collection</span>
                </template>
                <a-button
                  class="search-row__action-create"
                  @click="showCreateDialog(undefined, TypeEnum.collection.name)"
                >
                  <template #icon><FolderAddOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-input
                placeholder="Search for collection or folder"
                class="search-row__search-input"
                v-model:value="searchValue"
              >
                <template #suffix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
            <div class="explorer__tree">
              <a-tree
                v-if="data.treeData && data.treeData.length > 0"
                :tree-data="data.treeData"
                :field-Names="replaceFields"
                :show-icon="true"
                @expand="onExpand"
                :expandedKeys="expandedKeys"
                :auto-expand-parent="autoExpandParent"
              >
                <template #title="{ data, tabType }">
                  <div
                    class="tree-view-item"
                    :class="[
                      { hover: tabType !== TypeEnum.item.name },
                      {
                        selected:
                          tabType !== TypeEnum.item.name &&
                          data.id === selectedInfo.id,
                      },
                    ]"
                    @click="onSelect(data)"
                    @mouseenter="mouseenter(data)"
                    @mouseleave="mouseleave"
                  >
                    <div class="tree-view-left">
                      <div
                        class="folder-name"
                        v-if="
                          Object.prototype.hasOwnProperty.call(data, 'item')
                        "
                      >
                        <span
                          class="icon"
                          v-if="tabType === TypeEnum.folder.name"
                          ><folder-outlined
                        /></span>
                        <span class="name">{{ data.name }}</span>
                      </div>
                      <div class="item-name" v-else-if="!data.item">
                        <p
                          :class="{
                            opacity: data.tabType === TypeEnum.item.name,
                          }"
                        >
                          <span
                            v-if="data.request.method"
                            :class="
                              tabsData.classifyMethodColor(data.request.method)
                            "
                            class="method-label"
                            >{{ data.request.method }}</span
                          >
                          <span>{{ data.name }}</span>
                        </p>
                      </div>
                    </div>
                    <div
                      class="tree-view-right"
                      v-if="
                        tabType !== TypeEnum.item.name &&
                        hoverTarget.id === data.id
                      "
                      ref="createRef"
                    >
                      <a-tooltip placement="bottom">
                        <template #title>
                          <span>Create new folder</span>
                        </template>
                        <span
                          class="btn-add"
                          @click.stop="
                            showCreateDialog(data, TypeEnum.folder.name)
                          "
                          ><folder-add-outlined
                        /></span>
                      </a-tooltip>
                    </div>
                  </div>
                </template>
              </a-tree>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
  <a-modal
    v-model:open="isShowCreateDialog"
    :title="
      currentCreateType === TypeEnum.collection.name
        ? 'Create Collection'
        : 'Create Folder'
    "
    okText="Save"
    width="300px"
    class="create-modal"
    :ok-button-props="{ disabled: !createName }"
    @cancel="closeCreateDialog"
    @ok="onCreate"
  >
    <a-input v-model:value="createName" placeholder="Enter a name" />
  </a-modal>
</template>

<script>
import {
  watch,
  toRefs,
  ref,
  onMounted,
  reactive,
  getCurrentInstance,
  inject,
} from "vue";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import { createItem } from "@/js/ipc/itemIPC.js";
import { createFolder } from "@/js/ipc/folderIPC.js";
import { createCollection } from "@/js/ipc/collectionIPC.js";
import { useStore } from "vuex";
import tabsData from "@/store/tabs";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    newRequestData: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "close-save-request-dialog": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const store = useStore();

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const app = getCurrentInstance();
    const { dialogVisible, newRequestData } = toRefs(props);
    const visible = ref(false);

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    const cancel = (e) => {
      closeDialog();
    };

    const closeDialog = () => {
      visible.value = false;
      context.emit("close-save-request-dialog");
    };

    const formRef = ref();
    const formState = reactive({
      requestName: "",
    });

    const rules = {
      requestName: [
        {
          required: true,
          message: "Please enter a request name.",
          trigger: "blur",
        },
      ],
    };

    const replaceFields = {
      children: "item",
      title: "name",
      key: "id",
    };

    const expandedKeys = ref([]);
    const searchValue = ref("");
    const autoExpandParent = ref(true);

    const onExpand = (keys) => {
      expandedKeys.value = keys;
      autoExpandParent.value = false;
    };

    const originTreeData = ref([]);

    const addSlot = (data) => {
      if (Array.isArray(data)) {
        data.forEach((e, index) => {
          if (e) {
            e.index = index;
            addSlot(e);
          }
        });
      } else if (data instanceof Object) {
        if (classifyType(data) === TypeEnum.collection.name) {
          data.tabType = TypeEnum.collection.name;
        } else if (classifyType(data) === TypeEnum.folder.name) {
          data.tabType = TypeEnum.folder.name;
        } else {
          data.tabType = TypeEnum.item.name;
          data.disabled = true;
        }

        if (data.item && data.item.length) {
          data.item.forEach((el, index) => {
            if (el) {
              el.index = index;
              addSlot(el);
            }
          });
        }
      }
      originTreeData.value = JSON.parse(JSON.stringify(data));
    };

    const data = reactive({
      treeData: [],
    });

    watch(currentWorkspace, () => {
      if (!items.value || items.value.length === 0) {
        return;
      }

      data.treeData = JSON.parse(JSON.stringify(items.value));
      addSlot(data.treeData);
    });

    watch(
      searchValue,
      (value) => {
        const originData = JSON.parse(JSON.stringify(originTreeData.value));
        if (!value) {
          expandedKeys.value = [];
          data.treeData = originData;
          return;
        }
        data.treeData = originData;
        const expanded = [];
        const tempData = [];
        // showTip.value = false

        const getMatchItem = (list, parentItem = undefined) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].name.indexOf(value) > -1) {
              expanded.push(list[i].id); // 展開用
              list[i].isMatch = true;
              tempData.push(list[i]);
            } else {
              list[i].isMatch = false;
            }
            if (list[i].item && list[i].item.length) {
              getMatchItem(list[i].item, list[i]);
            }

            if (list[i].isMatch) {
              if (parentItem) {
                parentItem.isMatch = true;
                expanded.push(parentItem.id);
              }
            }
          }
          return list;
        };

        const searchList = getMatchItem(data.treeData);
        expandedKeys.value = expanded;
        const result = filterSearchList(searchList); // 篩出符合的資料
        data.treeData = result;
        if (data.treeData.length === 0) {
          // 搜尋結果無資料
          // showTip.value = true
        }
        searchValue.value = value;
      },
      {
        immediate: true,
      }
    );

    const filterSearchList = (list) => {
      const tempList = list.filter((e) => e.isMatch);
      return tempList.map((el) => {
        if (el.item && el.item.length > 0) {
          filterSearchList(el.item);
          if (filterSearchList(el.item).length > 0) {
            el.item = filterSearchList(el.item);
            el.isExpand = true;
          } else {
            el.isExpand = false;
          }
          checkExpandId(el);
          el.item = filterSearchList(el.item);
        }
        return el;
      });
    };

    const checkExpandId = (item) => {
      const findIndex = expandedKeys.value.findIndex((e) => e === item.id);
      if (findIndex > -1) {
        if (!item.isExpand) {
          expandedKeys.value.splice(findIndex, 1);
        }
      }
    };

    const selectedInfo = ref({});

    const onSelect = (data) => {
      if (data.tabType === TypeEnum.item.name) {
        return;
      }
      selectedInfo.value = data;
    };

    const onSave = async () => {
      const submitData = {
        parentId: selectedInfo.value.id,
        workspaceId: selectedInfo.value.workspaceId,
        itemsName: formState.requestName,
        request: newRequestData.value.request,
        description: newRequestData.value.description
          ? newRequestData.value.description
          : undefined,
        event: newRequestData.value.event
          ? newRequestData.value.event
          : undefined,
      };
      const res = await createItem(submitData);
      if (res.code === 20000) {
        window.showNotification("success", res.message);
        removeOldTab(newRequestData.value); // 先刪除舊資料
        createNewTab(res.data); // 用新資料建立一個tab
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    };

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    const removeOldTab = (data) => {
      const deletedItemIndex = tabsPane.value.findIndex(
        (e) => e.id === data.id && e.tabType === data.tabType
      );

      if (deletedItemIndex !== -1) {
        tabsPane.value.splice(deletedItemIndex, 1);
      }
      store.commit("DELETE_SINGLE_TAB", `${data.id}-${data.tabType}`); // 先刪除舊資料
    };

    const createNewTab = (data) => {
      data.tabType = classifyType(data);
      data.tabKey = data.id;
      $bus.emit("handleTabAddAndFocused", data);
    };

    /**
     * 新增 collection / folder
     */

    const isShowCreateDialog = ref(false);
    const createName = ref("");

    const closeCreateDialog = () => {
      isShowCreateDialog.value = false;
      createName.value = "";
    };

    const currentCreateType = ref("");
    const targetInfo = ref({});

    const showCreateDialog = (data, createType) => {
      if (createType === TypeEnum.folder.name) {
        Object.assign(targetInfo.value, data);
      }

      currentCreateType.value = createType;
      isShowCreateDialog.value = true;
    };

    const addFolder = async () => {
      const originalExpandedKeys = JSON.parse(
        JSON.stringify(expandedKeys.value)
      );
      const createData = {
        parentId: targetInfo.value.id,
        folderName: createName.value,
        workspaceId: currentWorkspace.value.id,
      };

      const res = await createFolder(createData);

      if (res.code === 20000) {
        const sameId = originalExpandedKeys.find(
          (e) => e === targetInfo.value.id
        );
        if (!sameId) {
          originalExpandedKeys.push(targetInfo.value.id);
          expandedKeys.value = originalExpandedKeys;
        }
        closeCreateDialog();
      }
    };

    const addCollection = async () => {
      const createData = {
        collectionsName: createName.value,
        workspaceId: currentWorkspace.value.id,
      };

      const res = await createCollection(createData);

      if (res.code === 20000) {
        closeCreateDialog();
      }
    };

    const onCreate = () => {
      if (currentCreateType.value === TypeEnum.collection.name) {
        addCollection();
      } else {
        addFolder();
      }
    };

    const hoverTarget = ref({});

    const mouseenter = (data) => {
      hoverTarget.value = data;
    };

    const mouseleave = () => {
      hoverTarget.value = {};
    };

    const items = computed(() => {
      return store.getters.getCurrentWorkspaceItems;
    });

    onMounted(() => {
      if (!items.value || items.value.length === 0) {
        return;
      }

      data.treeData = JSON.parse(JSON.stringify(items.value));
      addSlot(data.treeData);
    });

    return {
      formRef,
      formState,
      rules,
      data,
      replaceFields,
      expandedKeys,
      autoExpandParent,
      onExpand,
      addSlot,
      searchValue,
      checkExpandId,
      filterSearchList,
      selectedInfo,
      onSelect,
      visible,
      onSave,
      cancel,
      createNewTab,
      closeDialog,
      isShowCreateDialog,
      createName,
      closeCreateDialog,
      showCreateDialog,
      currentCreateType,
      addCollection,
      addFolder,
      onCreate,
      targetInfo,
      TypeEnum,
      mouseenter,
      mouseleave,
      hoverTarget,
      tabsData,
    };
  },
};
</script>

<style lang="scss" scoped>
$name-row-height: 60px;
$path-row-height: 28px;
$search-row-height: 26px;
$padding: 24px;
$message-height: 22px;

.save-request-modal-container {
  height: 100%;
  overflow: hidden;
}

.name-row {
  &:deep(.ant-form-item) {
    flex-direction: column;
  }

  &:deep(.ant-form-item-label) {
    font-weight: 500;
    text-align: left;

    & > label {
      font-size: 13px;
      color: #7e7d7d;
    }
  }

  &:deep(.ant-input) {
    border-radius: 4px;
  }
}

.search-row {
  display: flex;

  &:deep(.ant-btn) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;

    & > .anticon {
      line-height: 0;
    }

    &:hover {
      color: rgba(0, 0, 0, 0.85);
      border-color: $primary-blue;
      background-color: transparent;
    }

    &:focus {
      color: rgba(0, 0, 0, 0.85);
      border-color: #d9d9d9;
    }
  }

  &:deep(.ant-btn-icon-only) {
    width: fit-content;
    height: 26px;
    padding: 0 8px;
  }

  &:deep(.ant-input-affix-wrapper) {
    border-top-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  &__action-create {
    border-right: unset;
  }

  &__search-input {
    &:deep(.ant-input) {
      border-radius: 0;
    }

    &:deep(.ant-input-group-addon:last-child) {
      inset-inline-start: unset;

      .ant-input-search-button {
        border-left: unset;
        border-end-end-radius: 0;
      }
    }
  }
}

.path-row {
  margin-bottom: 8px;
  color: #7e7d7d;
  font-size: $text-size-m;
  font-weight: 600;
}

.selector-row {
  height: calc(
    100% - #{$name-row-height} - #{$path-row-height} - #{$message-height}
  );
  // height: calc(
  //   100% - #{$name-row-height} - #{$path-row-height} - #{$padding} - #{$message-height}
  // );
}

.collection-explorer {
  height: 100%;
}

.explorer {
  height: 100%;
  overflow: hidden;

  &__tree {
    height: calc(100% - #{$search-row-height});
    // height: 100%;
    border-left: 1px solid $primary-dark-grey;
    border-right: 1px solid $primary-dark-grey;
    border-bottom: 1px solid $primary-dark-grey;
    overflow-y: scroll;

    &:deep(.ant-tree li .ant-tree-node-content-wrapper:hover) {
      // background-color: #f5f5f5;
      background-color: unset;
      cursor: unset;
    }

    &:deep(.ant-tree li .ant-tree-node-content-wrapper.ant-tree-node-selected) {
      background-color: unset;
    }
  }
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
  margin-right: 5px;
  font-size: 9px;
  font-weight: 700;
}

.tree-view-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 6px;
  height: 28px;
}

.tree-view-right {
  .btn-add {
    padding: 5px;
  }
}

.opacity {
  opacity: 0.4;

  span:last-child {
    color: #333;
  }
}

.hover {
  &:hover {
    background-color: #f5f5f5;
    cursor: pointer;
  }
}

.selected {
  background-color: #e1e7eb;
}

.selected-info {
  margin-left: 5px;

  span {
    color: #255bbd;
  }
}
</style>

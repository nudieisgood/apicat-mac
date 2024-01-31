<template>
  <div
    class="requester-builder"
    ref="requesterBuilder"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >
    <div class="empty-block" v-if="tabsPane && tabsPane.length === 0">
      <div class="empty-block__wrapper">
        <img
          :src="require('@/assets/img/editor/icon-no-data.svg')"
          alt=""
          class="logo"
        />
      </div>
    </div>
    <a-tabs
      v-model:activeKey="activeKey"
      type="editable-card"
      @edit="addOrRemoveTab"
      @change="handleTabChange"
      v-if="currentWorkspace.id"
    >
      <template v-if="tabsPane && tabsPane.length > 0">
        <a-tab-pane
          v-for="pane in tabsPane"
          :key="`${pane.tabKey}-${pane.tabType}`"
          :closable="pane.closable"
          class="requester-pane"
        >
          <template #tab>
            <span class="requester-builder-tab-pin" v-if="pane.isPin" />
            <div class="requester-builder-tab">
              <div class="requester-builder-tab-name">
                {{
                  pane.tabType === TypeEnum.globals.name ? "Globals" : pane.name
                }}
              </div>
              <div
                class="requester-builder-tab-editing"
                v-if="
                  pane.isEditing && pane.tabType !== TypeEnum.workspace.name
                "
              />
            </div>
          </template>

          <div
            class="requester-pane-container"
            v-show="`${pane.tabKey}-${pane.tabType}` === activeKey"
          >
            <!-- <div
            class="requester-pane-container"
            v-show="
              pane.id === currentTabData.id &&
              pane.tabType === currentTabData.tabType
            "
          > -->
            <template v-if="loading">
              <request-loader />
            </template>
            <div class="requester-builder-box">
              <div class="requester-builder-container" :style="'width:100%'">
                <div class="requester-builder-header">
                  <div
                    class="requester-builder-header__name"
                    v-if="pane.tabType !== TypeEnum.workspace.name"
                  >
                    <div class="requester-builder-header__name-box">
                      <!-- request method -->
                      <span
                        v-if="pane.tabType === TypeEnum.item.name"
                        class="requester-builder-header__request-method"
                        :class="
                          tabsData.classifyMethodColor(pane.request.method)
                        "
                        v-text="pane.request.method"
                      />
                      <!-- tab name input -->
                      <div
                        class="requester-builder-header__name-editor"
                        v-if="isShowEdit"
                      >
                        <a-input
                          v-model:value="pane.name"
                          @blur="nameInputOnBlur(pane)"
                          v-focus
                          @keyup.enter="nameInputOnBlur(pane)"
                        />
                      </div>
                      <!-- tab name -->
                      <div v-else class="requester-builder-header__name-text">
                        <span>{{ paneName(pane) }}</span>
                        <div
                          @click="isShowEdit = true"
                          v-if="
                            pane.name &&
                            pane.workspaceId &&
                            pane.tabType !== TypeEnum.globals.name &&
                            isEditable
                          "
                          class="action-edit-icon"
                        >
                          <img
                            :src="require('@/assets/img/editor/icon-edit.png')"
                            alt="not-hover-icon"
                            class="action-edit-icon--not-hover"
                          />
                          <img
                            :src="
                              require('@/assets/img/editor/icon-edit-hover.png')
                            "
                            alt="hover-icon"
                            class="action-edit-icon--hover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="requester-builder-header__actions"
                    v-if="isEditable"
                  >
                    <a-button
                      class="action-save"
                      @click="onSave(pane)"
                      :disabled="!pane.isEditing"
                      v-if="pane.tabType !== TypeEnum.workspace.name"
                    >
                      <div class="icon-save">
                        <img
                          :src="require('@/assets/img/editor/icon-save.svg')"
                          alt="not-hover-icon"
                          class="icon-save--not-hover"
                        />
                        <img
                          :src="
                            require('@/assets/img/editor/icon-save-hover.svg')
                          "
                          alt="hover-icon"
                          class="icon-save--hover"
                        />
                        <img
                          :src="
                            require('@/assets/img/editor/icon-save-disabled.svg')
                          "
                          alt="hover-icon"
                          class="icon-save--disabled"
                        />
                      </div>
                      Save
                    </a-button>
                    <div
                      class="action-bar"
                      v-if="
                        pane.workspaceId &&
                        pane.tabType !== TypeEnum.globals.name
                      "
                      @click.stop
                    >
                      <a-popover
                        trigger="click"
                        :getPopupContainer="(trigger) => trigger.parentNode"
                        placement="bottomRight"
                        :open="actionsVisible"
                      >
                        <template #content>
                          <ul class="action-list">
                            <li @click="openTipDialog(pane)">
                              <a class="actions-item actions-item--delete"
                                >Delete</a
                              >
                            </li>
                          </ul>
                        </template>
                        <div
                          class="icon-list"
                          @click="actionsVisible = true"
                          v-click-outside="onClickOutside"
                        />
                      </a-popover>
                    </div>
                    <div
                      class="action-document"
                      @click="openDocument(pane)"
                      v-if="checkIsShowRightPane(pane)"
                    >
                      <div
                        class="icon-document"
                        :class="{
                          'icon-document--actived': pane.isShowDocument,
                        }"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="editor"
                  :class="[
                    {
                      'reduce-header-height':
                        pane.tabType !== TypeEnum.workspace.name,
                    },
                    { 'add-gap': pane.isShowDocument },
                  ]"
                >
                  <div
                    class="editor__block editor__left-block"
                    :style="
                      pane.isShowDocument
                        ? `width:calc(100% - 400px)`
                        : 'width:100%'
                    "
                  >
                    <!-- <div class="editor__block editor__left-block" :style="pane.isShowDocument?editorWidth:'width:100%'"> -->
                    <collection-editor
                      v-if="pane.tabType === TypeEnum.collection.name"
                      :tab-info="pane"
                    />
                    <folder-editor
                      v-else-if="pane.tabType === TypeEnum.folder.name"
                      :tab-info="pane"
                    />
                    <request-editor
                      v-else-if="pane.tabType === TypeEnum.item.name"
                      :tab-info="pane"
                    />
                    <variable-editor
                      v-else-if="
                        pane.tabType === TypeEnum.globals.name ||
                        pane.tabType === TypeEnum.environment.name
                      "
                      :tab-info="pane"
                    />
                    <main-page
                      v-else-if="pane.tabType === TypeEnum.workspace.name"
                      :tab-info="pane"
                    />
                    <response-example
                      v-else-if="pane.tabType === TypeEnum.example.name"
                      :tab-info="pane"
                    />
                  </div>
                  <!-- <div class="editor__block editor__right-block" :style="checkIsShowRightPane(pane)?{'width':`${documentBlockWidth}px`}:'width:0'" v-if="checkIsShowRightPane(pane)" :class="[{'slide':isShowDocument}, {'hide':!isShowDocument}]"> -->
                  <div
                    class="editor__block editor__right-block"
                    :class="[
                      { slide: pane.isShowDocument },
                      { hide: !pane.isShowDocument },
                    ]"
                    :style="{ width: pane.isShowDocument ? '400px' : '0px' }"
                  >
                    <!-- <div class="editor__block editor__right-block" :class="[{'slide':pane.isShowDocument}, {'hide':!pane.isShowDocument}]" :style="{'width':`${documentBlockWidth}px`}"> -->
                    <documentation
                      :tab-Info="pane"
                      @hide-document="hideDocument(pane)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </template>
    </a-tabs>
  </div>
  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="isShowTipDialog = false"
    :deleted-data="selectedData"
  />
  <save-request-dialog
    v-if="isShowSaveRequestDialog"
    :dialogVisible="isShowSaveRequestDialog"
    @close-save-request-dialog="isShowSaveRequestDialog = false"
    :new-request-data="newRequestData"
  />
  <close-dialog
    v-if="showConfirmCloseDialog"
    :dialog-visible="showConfirmCloseDialog"
    @close-close-dialog="
      (showConfirmCloseDialog = false), (isSelectCloseAllTabs = false)
    "
    @save-change="saveDialogChange"
    @unsave-change="unSaveDialogChange"
    :current-close-tab-key="currentCloseTabKey"
  />
  <context-menu
    v-if="isShowContextMenu"
    :position-data="positionData"
    :menu-visible="isShowContextMenu"
    @close-context-menu="isShowContextMenu = false"
    :tab-data="correspondingTabData"
    @show-confirm-dialog="showConfirmDialog"
    @handle-close-all-tabs="handleCloseAllTabs"
  />
  <confirm-dialog
    v-if="isShowConfirmDialog"
    :dialog-visible="isShowConfirmDialog"
    @close-confirm-dialog="isShowConfirmDialog = false"
    :total-editing-tab-num="totalEditingTabNum"
  />
</template>
<script>
import {
  ref,
  onMounted,
  reactive,
  watch,
  onBeforeUnmount,
  computed,
  nextTick,
  inject,
} from "vue";
import RequestEditor from "@/components/RequestEditor";
import FolderEditor from "@/components/FolderEditor";
import CollectionEditor from "@/components/CollectionEditor";
import VariableEditor from "@/components/Layout/Header/Environment/variableEditor.vue";
import TipDialog from "@/components/TipDialog";
import workspaceData from "@/store/workspace";
import tabsData from "@/store/tabs";
import environmentData from "@/store/environment";
import { editCollection } from "@/js/ipc/collectionIPC.js";
import { editFolder } from "@/js/ipc/folderIPC.js";
import {
  closeTabView,
  openTabView,
  editWorkspace,
} from "@/js/ipc/workspaceIPC.js";
import { editItem } from "@/js/ipc/itemIPC.js";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import { useStore } from "vuex";
import MainPage from "@/components/Layout/Header/Workspace/mainPage.vue";
import SaveRequestDialog from "@/components/RequesterBuilder/saveRequestDialog.vue";
import Helper from "@/js/utils/helper";
import CloseDialog from "@/components/CloseDialog";
import { createEnvironment, editEnvironment } from "@/js/ipc/environmentIPC.js";
import ResponseExample from "@/components/ResponseExample";
import Documentation from "@/components/RequesterBuilder/documentation.vue";
import RequestLoader from "@/components/Loader/requestLoader";
import ContextMenu from "@/components/RequesterBuilder/ContextMenu";
import ConfirmDialog from "@/components/RequesterBuilder/ContextMenu/confirmDialog";

const focus = {
  mounted(el) {
    el.focus();
  },
};

export default {
  components: {
    RequestEditor,
    FolderEditor,
    CollectionEditor,
    TipDialog,
    MainPage,
    SaveRequestDialog,
    CloseDialog,
    ResponseExample,
    Documentation,
    RequestLoader,
    ContextMenu,
    ConfirmDialog,
    VariableEditor,
  },
  setup() {
    const $bus = inject("$bus");

    const store = useStore();
    const activeKey = ref("");
    const isVisible = ref(false);
    const actionsVisible = ref(false);
    const isShowTipDialog = ref(false);
    const showConfirmCloseDialog = ref(false);
    const currentCloseTabKey = ref(null);

    const add = async () => {
      const obj = reactive({
        id: Date.now(),
        name: "Untitled Request",
        description: null,
        event: null,
        request: {
          url: null,
          auth: null,
          proxy: null,
          certificate: null,
          method: "GET",
          description: null,
          header: null,
          body: null,
        },
        response: null,
        isEditing: false,
      });
      obj.tabType = classifyType(obj);
      obj.tabKey = obj.id;
      handleTabAddAndFocused(obj);
    };

    const remove = async () => {
      store.commit("DELETE_SINGLE_TAB", currentCloseTabKey.value);

      await closeTabView({ id: currentCloseTabKey.value });

      // 移除tab後，若沒有開啟任何 tab 時，需清空當前 tab 相關資料
      if (!tabsPane.value.length) {
        activeKey.value = "";
        tabsData.tabInfo.originalTab = {};
        tabsData.tabInfo.comparedTab = {};
        isSelectCloseAllTabs.value && (isSelectCloseAllTabs.value = false);
        return;
      }

      /**
       * 確認focus的tab是否還在：
       * 若移除的tab是focus狀態，該tab被移除後，預設tabsPane的最後一個tab為focus狀態
       * 若移除的tab是非focus狀態，移除tab後，原本focus狀態的tab繼續維持
       */

      const focusTab = tabsPane.value.find(
        (pane) => `${pane.tabKey}-${pane.tabType}` === activeKey.value
      );

      if (!focusTab) {
        const lastTabInfo = tabsPane.value[tabsPane.value.length - 1];
        activeKey.value = `${lastTabInfo.tabKey}-${lastTabInfo.tabType}`;
        handleTabChange(activeKey.value);
      }
    };

    const addOrRemoveTab = (targetKey, action) => {
      if (action === "add") {
        add();
        return;
      }

      const pane = tabsPane.value.find(
        (item) => `${item.tabKey}-${item.tabType}` === targetKey
      );

      if (!pane) return;

      if (pane.isEditing) {
        currentCloseTabKey.value = targetKey;
        showConfirmCloseDialog.value = true;
      } else {
        currentCloseTabKey.value = targetKey;
        remove();
      }
    };

    const saveDialogChange = async () => {
      await onSave(currentTabData.value);
      await remove();

      showConfirmCloseDialog.value = false;
    };

    const unSaveDialogChange = async () => {
      await remove();
      showConfirmCloseDialog.value = false;
    };

    const isShowEdit = ref(false);

    const updateRequestData = async (pane) => {
      const obj = {
        itemsId: pane.id,
        itemsName: pane.name,
        description: pane.description ? pane.description : undefined,
        event: pane.event ? pane.event : undefined,
        // response: [],
        response: pane.response,
        request: JSON.parse(JSON.stringify(pane.request)),
        workspaceId: pane.workspaceId,
      };

      const res = await editItem(obj);
      return res;
    };

    const updateFolderData = async (pane) => {
      const obj = {
        folderId: pane.id,
        folderName: pane.name,
        description: pane.description ? pane.description : undefined,
        variable: pane.variable ? pane.variable : undefined,
        event: pane.event ? pane.event : undefined,
        auth: pane.auth ? pane.auth : undefined,
        workspaceId: pane.workspaceId,
      };
      const formatObj = JSON.parse(JSON.stringify(obj));

      const res = await editFolder(formatObj);
      return res;
    };

    const updateCollectionData = async (pane) => {
      const obj = {
        collectionsId: pane.id,
        collectionsName: pane.name,
        description: pane.description ? pane.description : undefined,
        variable: pane.variable ? pane.variable : undefined,
        event: pane.event ? pane.event : undefined,
        auth: pane.auth ? pane.auth : undefined,
        workspaceId: pane.workspaceId,
      };

      const res = await editCollection(obj);
      return res;
    };

    const updateEnvironmentData = async (pane) => {
      const obj = {
        environmentId: pane.id,
        workspaceId: currentWorkspace.value.id,
        environmentName: pane.name,
        variable: pane.variable,
      };
      const formatObj = JSON.parse(JSON.stringify(obj));

      const res = await editEnvironment(formatObj);
      if (res.code === 20000) {
        // workspaceData.reloadVariables();
        let scope = {
          environmentVariable: res.data.variable,
        };
        store.commit("SET_VARIABLES_STATE", scope);
      }

      return res;
    };

    const items = computed(() => {
      return store.getters.getCurrentWorkspaceItems;
    });

    const updateResponseExample = async (pane) => {
      const targetRequestData = tabsData.getCurrentItemData(
        items.value,
        pane.requestId
      );
      if (targetRequestData) {
        const currentResponseIndex = targetRequestData.response.findIndex(
          (res) => res.id === pane.id
        );
        if (currentResponseIndex > -1) {
          if (!pane.id) {
            // 有一個狀況是：從postman匯出帶有response-example的collection再匯入後，response-example沒有id，於此存入id
            pane.id = Date.now();
          }
          Object.assign(targetRequestData.response[currentResponseIndex], pane);
        }
        return await updateRequestData(targetRequestData);
      }
    };

    const updateWorkspaceData = async (pane) => {
      const obj = {
        workspaceId: currentWorkspace.value.id,
        workspaceName: pane.name,
        variable: pane.variable ? pane.variable : undefined,
      };
      const formatObj = JSON.parse(JSON.stringify(obj));

      const res = await editWorkspace(formatObj);
      if (res.code === 20000) {
        store.commit("UPDATE_TAB", pane);
        workspaceData.reloadVariables();
      }

      return res;
    };

    const newRequestData = reactive({});

    const checkTypeToUpdateData = async (pane) => {
      // 沒有所屬collection的request，開啟Save Request Dialog
      if (!pane.workspaceId && pane.tabType === TypeEnum.item.name) {
        Object.assign(newRequestData, pane);
        isShowSaveRequestDialog.value = true;
        return;
      }

      // 非編輯狀態，不執行儲存
      // if (!pane.isEditing) return

      let res = {};

      if (pane.tabType === TypeEnum.item.name) {
        res = await updateRequestData(pane);
      } else if (pane.tabType === TypeEnum.folder.name) {
        res = await updateFolderData(pane);
      } else if (pane.tabType === TypeEnum.collection.name) {
        res = await updateCollectionData(pane);
      } else if (pane.tabType === TypeEnum.environment.name) {
        res = await updateEnvironmentData(pane);
      } else if (pane.tabType === TypeEnum.globals.name) {
        res = await updateWorkspaceData(pane);
      } else if (pane.tabType === TypeEnum.example.name) {
        res = await updateResponseExample(pane);
      }

      if (isShowEdit.value) {
        isShowEdit.value = false;
      }

      // pane.isEditing = false;

      if (res.code === 20000) {
        overwriteTabData(pane);
      } else {
        window.showNotification("warn", res.message);
      }
    };

    const onSave = Helper.throttle((pane) => {
      checkTypeToUpdateData(pane);
    });

    const nameInputOnBlur = (pane) => {
      // 編輯 tab 名稱且為空值，則不進行儲存，並維持編輯前的名稱
      if (!pane.name) {
        pane.name = tabsData.tabInfo.originalTab.name;
        isShowEdit.value = false;
        return;
      }
      onSave(pane);
    };

    const loading = ref(false);

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    const currentTabData = computed(() => {
      return store.getters.getCurrentTabData;
    });

    const handleTabChange = async (activeVal) => {
      // 切換tab時，從workspaceTree同步資料
      nextTick(async () => {
        const currentTabInfo = tabsPane.value.find(
          (e) => `${e.tabKey}-${e.tabType}` === activeVal
        );

        if (currentTabInfo) {
          await store.commit("SET_CURRENT_TAB_INFO", currentTabInfo);
          activeKey.value = activeVal;
        }
        workspaceData.reloadVariables();

        // 複製一份未編輯前的資料，會與編輯時的tab做比較判斷是否顯示小橘點(表示編輯中)
        // 創建新的 originalTab 物件，排除指定的屬性 (以下屬性不作為編輯狀態的判斷條件)
        const {
          isEditing,
          isPin,
          responseBoxWidth,
          responseBoxHeight,
          ...rest
        } = currentTabInfo;

        tabsData.tabInfo.originalTab = JSON.parse(JSON.stringify(rest));
        tabsData.tabInfo.comparedTab = rest;

        setTimeout(() => {
          loading.value = false;
        }, 1500);
      });
    };

    const handleTabAddAndFocused = async (data) => {
      const initData = tabsData.checkTypeToInitAndUseData(
        JSON.parse(JSON.stringify(data))
      );

      await tabsData.updateAndUseInheritedAuth(initData);
      if (actionsVisible.value) {
        actionsVisible.value = false;
      }

      const sameItem = tabsPane.value.find(
        (e) => e.tabKey === initData.tabKey && e.tabType === initData.tabType
      );

      if (!sameItem) {
        // 無資料則新增
        loading.value = true;
        store.commit("SET_TAB_TO_PANE", initData);
        store.commit("SET_TABS_ARRAY", initData); // 用於紀錄最後操作
      }

      const activeVal = `${initData.tabKey}-${initData.tabType}`;
      const tabViewObj = {
        workspaceId: currentWorkspace.value.id,
        id: activeVal,
      };

      await openTabView(tabViewObj);

      handleTabChange(activeVal);
    };

    const selectedData = ref({});
    const openTipDialog = (pane) => {
      selectedData.value = pane;
      isShowTipDialog.value = true;
      actionsVisible.value = false;
    };

    // 讀取最後一次被選擇的tab id
    const setActiveId = () => {
      if (!tabsPane.value || !tabsPane.value.length) return;

      if (store.getters.getSelectedTabId) {
        const result = store.getters.getTabsArray.find(
          (e) => `${e.tabKey}-${e.tabType}` === store.getters.getSelectedTabId
        );

        if (result) {
          handleTabAddAndFocused(result);
        }
      } else {
        activeKey.value = "";
      }
    };

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    watch(
      () => currentWorkspace.value.id,
      (newVal, oldVal) => {
        if (!currentWorkspace.value.variable) {
          currentWorkspace.value.variable = [];
        }
      },
      {
        immediate: true,
        // deep: true
      }
    );

    const isShowSaveRequestDialog = ref(false);

    // 透過 ctrl+s 進行儲存
    const saveByKeydown = (e) => {
      const currentTabInfo = tabsPane.value.find(
        (item) => `${item.tabKey}-${item.tabType}` === activeKey.value
      );

      if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault();
        onSave(currentTabInfo);
      }
    };

    const onClickOutside = (event) => {
      actionsVisible.value = false;
    };

    watch(
      () => store.getters.getSelectedTabId,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          activeKey.value = newVal;
        }
      },
      {
        immediate: true,
      }
    );

    // close tab by "ctrl + W"
    const closeTabByKeyDown = (e) => {
      if (e.keyCode === 87 && e.ctrlKey) {
        e.preventDefault();
        addOrRemoveTab(activeKey.value, "remove");
      }
    };

    const requesterBuilder = ref();

    // 開啟/關閉 sidebar 會影響 table的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {
    //     // const dom = requesterBuilder.value
    //     if (newVal !== oldVal) {
    //       nextTick(() => {
    //         // tabsData.setBoxScreenLeft(dom.getBoundingClientRect().left)
    //       });
    //     }
    //   }
    // );

    onMounted(() => {
      window.addEventListener("keydown", saveByKeydown);
      window.addEventListener("keydown", closeTabByKeyDown);
      // const dom = requesterBuilder.value
      // tabsData.setBoxScreenLeft(dom.getBoundingClientRect().left)
      nextTick(() => {
        $bus.on("handleTabAddAndFocused", (data) => {
          handleTabAddAndFocused(data);
        });
        $bus.on("addRequest", (envId) => {
          add();
        });

        $bus.on("addEnvironment", () => {
          addEnvironment();
        });
        $bus.on("onSave", (tabInfo) => {
          onSave(tabInfo);
        });
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", saveByKeydown);
      window.removeEventListener("keydown", closeTabByKeyDown);

      $bus.off("handleTabAddAndFocused");
      // $bus.off(
      //   "handleTabAddAndFocused"
      // );
      $bus.off("addRequest");
      $bus.off("addEnvironment");
      $bus.off("onSave");
    });

    const addEnvironment = async () => {
      const createData = {
        workspaceId: currentWorkspace.value.id,
        environmentName: "New Environment",
        variable: [],
      };
      const res = await createEnvironment(createData);
      if (res.code === 20000) {
        const obj = {};
        Object.assign(obj, res.data);
        obj.tabType = "environment";
        handleTabAddAndFocused(obj);
      }
    };

    const checkIsShowRightPane = (pane) => {
      if (pane.workspaceId) {
        if (
          pane.tabType === TypeEnum.collection.name ||
          pane.tabType === TypeEnum.folder.name ||
          pane.tabType === TypeEnum.item.name
        ) {
          return true;
        }
      } else {
        return false;
      }
    };

    // const documentBlockWidth = ref(0)
    const documentBlockWidth = computed(() => {
      if (isShowDocument.value) {
        return 400;
      }
      return 0;
    });

    const editorWidth = computed(() => {
      if (isShowDocument.value) {
        return `width: calc(100% - ${documentBlockWidth.value}px)`;
      }
      return "width: 100%";
    });
    // const editorWidth = computed(() => `width: calc(100% - ${documentBlockWidth.value}px)`)
    const isShowDocument = ref(false);
    const openDocument = (pane) => {
      pane.isShowDocument = true;
      isShowDocument.value = true;
    };

    const hideDocument = (pane) => {
      pane.isShowDocument = false;
      isShowDocument.value = false;
    };

    const isRightClick = ref(true);
    const isShowContextMenu = ref(false);

    const onMouseDown = (e) => {
      // 點了滑鼠右鍵，若contextMenu原本為顯示狀態，先隱藏，並透過判斷點右鍵的範圍決定是否再度顯示contextMenu
      if (e.button === 2) {
        isRightClick.value = true;
      } else {
        isRightClick.value = false;
      }
      isShowContextMenu.value = false;
    };

    const endX = ref(null);
    const endY = ref(null);

    const onMouseUp = (e) => {
      if (isRightClick.value) {
        endX.value = e.clientX;
        endY.value = e.clientY;
        checkDomRange();
      }
    };

    const positionData = reactive({}); // 紀錄contextMenu應顯示的位置
    const correspondingTabData = ref({}); // 紀錄點右鍵時，當下點擊位置所對應的tab資料
    const checkDomRange = () => {
      const tabNav = document.querySelector(
        ".requester-builder .ant-tabs-nav-wrap"
      );
      const rectSelect = tabNav.getClientRects()[0];
      const isInHorizontalAxis =
        endX.value > rectSelect.left && endX.value < rectSelect.right;
      const isInVerticalAxis =
        endY.value > rectSelect.top && endY.value < rectSelect.bottom;
      if (isInHorizontalAxis && isInVerticalAxis) {
        // 有在tabNav範圍內才顯示contextMenu
        positionData.top = endY.value;
        positionData.left = endX.value;
        isShowContextMenu.value = true;
        isRightClick.value = false;
      }
      document
        .querySelectorAll(".requester-builder .ant-tabs-tab")
        .forEach((node, index) => {
          const rects = node.getClientRects()[0];
          const isInTabHorizontalAxis =
            endX.value > rects.left && endX.value < rects.right;
          const isInTabVerticalAxis =
            endY.value > rects.top && endY.value < rects.bottom;
          if (isInTabHorizontalAxis && isInTabVerticalAxis) {
            // 表示點右鍵時，當下點擊位置所對應的tab
            correspondingTabData.value = tabsPane.value[index];
          }
        });
    };

    const overwriteTabData = (duplicateTab) => {
      // duplicate tab時，若更新該tab資料成功，要將新資料更新至原本的tab
      const originalTab = tabsPane.value.find(
        (e) =>
          e.id === duplicateTab.id &&
          e.tabType === duplicateTab.tabType &&
          e.tabKey === duplicateTab.tabKey
      );
      if (!originalTab) {
        // 若原本的tab是非開啟的狀態，則不進行複寫動作
        return;
      }
      const tempTab = JSON.parse(JSON.stringify(duplicateTab));
      delete tempTab.tabKey;
      Object.assign(originalTab, tempTab);
      store.commit("UPDATE_TAB", tempTab);

      const { isEditing, isPin, responseBoxWidth, responseBoxHeight, ...rest } =
        originalTab;

      // 更新 originalTab 物件，以利後續判斷 tab 編輯狀態
      tabsData.tabInfo.originalTab = JSON.parse(JSON.stringify(rest));
    };

    const isSelectCloseAllTabs = ref(false); // 紀錄是否為選擇close all tabs功能，若有多個編輯中狀態的tab需一個一個去確認是否移除

    const handleCloseAllTabs = () => {
      isSelectCloseAllTabs.value = true;
      checkRemove(tabsPane.value[tabsPane.value.length - 1]);
    };

    const checkRemove = (tab) => {
      addOrRemoveTab(`${tab.tabKey}-${tab.tabType}`, "remove");
    };

    const totalEditingTabNum = ref(0);
    const isShowConfirmDialog = ref(false);

    const showConfirmDialog = (editTabListLength) => {
      isShowConfirmDialog.value = true;
      totalEditingTabNum.value = editTabListLength;
    };

    const isShowLayoutLoading = computed(() => {
      return store.getters.isShowLayoutLoading;
    });

    watch(
      () => tabsPane,
      (newVal, oldVal) => {
        // console.log("--- tabsPane is changed ---");
        // console.log(isShowLayoutLoading.value);

        // NOTE: 2023/11/22 切換 workspace時，先用此狀態來判斷 workspaceData 執行的 setCurrentWorkspaceData 是否完成，因裡面的 tabsData.setTabsPane() 會影響判斷編輯狀態，當有值時，會直接跑下方的編輯狀態判斷，再做 tab 切換的流程；故當 isShowLayoutLoading 尚未為 false 時，先不跑下方的判斷邏輯
        if (isShowLayoutLoading.value) return;

        if (loading.value) return;

        const resultIndex = tabsPane.value.findIndex(
          (el) => el.id === tabsData.tabInfo.originalTab.id
        );
        if (resultIndex > -1) {
          // console.log(
          //   "tabsPane[resultIndex]__",
          //   JSON.parse(JSON.stringify(tabsPane.value[resultIndex]))
          // );
          // console.log(
          //   "tabsPane[resultIndex]__",
          //   JSON.stringify(tabsPane.value[resultIndex])
          // );

          // console.log(
          //   "tabsData.tabInfo.originalTab__",
          //   JSON.stringify(tabsData.tabInfo.originalTab)
          // );
          const {
            isEditing,
            isPin,
            responseBoxWidth,
            responseBoxHeight,
            ...rest
          } = tabsPane.value[resultIndex];
          // console.log("rest__", JSON.stringify(rest));

          const isEqual =
            JSON.stringify(rest) ===
            JSON.stringify(tabsData.tabInfo.originalTab);
          // const isEqual = lodash.isEqual(rest, tabsData.tabInfo.originalTab); // 會發生內容一樣，但回傳 false
          // console.log("isEqual__", isEqual);
          tabsPane.value[resultIndex].isEditing = !isEqual;
        }
      },
      {
        // immediate: true,
        deep: true,
      }
    );

    const paneName = (pane) => {
      return pane.tabType === TypeEnum.globals.name
        ? "Globals"
        : pane.name
        ? pane.name
        : "Untitled Request";
    };

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    watch(
      () => showConfirmCloseDialog.value,
      () => {
        /**
         * 確認是否儲存彈窗為關閉狀態時，若關閉全部標籤的狀態為true，則繼續依序詢問是否儲存編輯中的標籤
         */
        if (!showConfirmCloseDialog.value) {
          if (isSelectCloseAllTabs.value) {
            checkRemove(tabsPane.value[tabsPane.value.length - 1]);
          }
        }
      },
      {
        immediate: true,
      }
    );

    watch(
      () => isShowLayoutLoading.value,
      (newVal, oldVal) => {
        if (!newVal) {
          setActiveId();
        }
      },
      {
        immediate: true,
      }
    );

    return {
      activeKey,
      addOrRemoveTab,
      add,
      isShowEdit,
      onSave,
      tabsData,
      handleTabChange,
      updateRequestData,
      updateFolderData,
      updateCollectionData,
      environmentData,
      isVisible,
      actionsVisible,
      isShowTipDialog,
      openTipDialog,
      selectedData,
      isShowSaveRequestDialog,
      saveByKeydown,
      TypeEnum,
      saveDialogChange,
      unSaveDialogChange,
      showConfirmCloseDialog,
      onClickOutside,
      checkIsShowRightPane,
      newRequestData,
      addEnvironment,
      requesterBuilder,
      documentBlockWidth,
      editorWidth,
      isShowDocument,
      loading,
      openDocument,
      hideDocument,
      onMouseDown,
      isShowContextMenu,
      onMouseUp,
      positionData,
      correspondingTabData,
      handleCloseAllTabs,
      currentCloseTabKey,
      showConfirmDialog,
      isShowConfirmDialog,
      totalEditingTabNum,
      isSelectCloseAllTabs,
      paneName,
      nameInputOnBlur,
      isEditable,
      currentWorkspace,
      tabsPane,
      currentTabData,
    };
  },
  directives: {
    focus,
  },
};
</script>

<style scoped lang="scss">
$requester-tabs-header-height: 32px;
$requester-tabs-header-margin: 21px;

.requester-builder-tab {
  position: relative;
  // width: 85px;
}

.requester-builder-tab-name {
  width: 80px;
  overflow: hidden;
  // white-space: nowrap;
  text-overflow: ellipsis;
}

.requester-builder-tab-editing {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  background-color: #ff9224 !important;
}

.requester-builder-tab-pin {
  position: absolute;
  top: 0;
  left: 2px;
  width: 12px;
  height: 12px;
  display: block;
  background-position: center center;
  background-repeat: no-repeat;
  background-image: url("~@/assets/img/editor/icon-pin.png");
  background-size: contain;
  transform: rotate(270deg);
}

.requester-builder {
  position: relative;
  height: 100%;
  z-index: 1;

  &:deep(.ant-tabs-bar) {
    // margin: 10px 10px 0 10px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  &:deep(.ant-tabs) {
    .ant-tabs-top-content {
      padding: 10px;
      background-color: #fff;
    }
  }
}

.empty-block {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: calc(100% - 40px);
  margin-top: auto;
  background-color: $primary-white;
  z-index: 5;
  display: flex;

  &__wrapper {
    // position: absolute;
    // top: 50%;
    // left: 50%;
    width: 300px;
    height: 300px;
    // transform: translate(-50%, -50%);
    margin: auto;
    text-align: center;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.requester-builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 21px;
  gap: 6px;

  &__name {
    // flex: 1;
    // min-width: 0;
    // flex-basis: 80%;
    width: calc(100% - 160px);

    p {
      margin-bottom: 0;
      font-weight: 600;
    }
  }

  &__name-box {
    display: flex;
    align-items: center;
    gap: 15px;
    // margin-left: 8px;
  }

  &__request-method {
    font-size: 20px;
    font-weight: 600;
  }

  &__name-text {
    display: inline-flex;
    align-items: center;
    width: calc(100% - 65px);
    font-size: 20px;
    font-weight: 600;

    span {
      display: inline-block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: inherit;
    }
  }

  &__actions {
    display: flex;
    max-width: 140px;
    width: fit-content;
    gap: 10px;
  }

  .action-save {
    display: flex;
    align-items: center;

    &:hover {
      .icon-save--not-hover {
        opacity: 0;
      }

      .icon-save--hover {
        opacity: 1;
      }

      color: $primary-white;
      background: $primary-blue;
    }

    &:disabled {
      .icon-save--not-hover {
        opacity: 0;
      }
      .icon-save--disabled {
        opacity: 1;
      }
      &:hover {
        color: #cccccc;
        background: unset;
      }
    }
  }

  .action-bar {
    width: 24px;
    // margin-left: 20px;
    padding: 5px 0;
    text-align: center;
    cursor: pointer;

    .ant-popover-open {
      display: block;
      height: 100%;
    }
  }

  .icon-save {
    position: relative;
    width: 16px;
    height: 100%;
    display: block;
    margin-right: 6px;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    img {
      width: 100%;
      height: 100%;
      display: block;
    }

    &--not-hover {
      opacity: 1;
    }

    &--hover {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
    }

    &--disabled {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
    }
  }
}

.action-edit-icon {
  position: relative;
  width: 30px;
  height: 20px;
  display: block;
  // background-position-y: center;
  // background-repeat: no-repeat;
  // background-size: contain;
  // background-image: url("~@/assets/img/editor/icon-edit.png");
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  &--hover {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  &:hover {
    .action-edit-icon--not-hover {
      opacity: 0;
    }

    .action-edit-icon--hover {
      opacity: 1;
    }
  }

  // &:hover {
  //   background-position-y: center;
  //   background-repeat: no-repeat;
  //   background-image: url("~@/assets/img/editor/icon-edit-hover.png");
  // }
}

.action-list {
  padding: 0;
  list-style-type: unset;
  margin-bottom: 0;

  li {
    cursor: pointer;
  }
}

.actions-item {
  color: #333;

  &--delete {
    color: #ff5151;
  }
}

.requester-builder-box {
  height: 100%;
  display: flex;
}

.requester-builder-container {
  height: 100%;
  padding: 16px 8px;
  overflow: hidden;
}

.requester-pane {
  height: 100%;
}

.requester-pane-container {
  position: relative;
  height: 100%;
}

.icon-list {
  width: 100%;
  height: 100%;
  display: block;
  background-position-y: center;
  background-repeat: no-repeat;
  background-image: url("~@/assets/img/editor/icon-list.png");
  background-size: contain;

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-image: url("~@/assets/img/editor/icon-list-hover.png");
  }
}

.action-document {
  width: 16px;
  // margin-right: 5px;
  // margin-left: 20px;
}

.icon-document {
  width: 100%;
  height: 100%;
  display: block;
  background-position-y: center;
  background-repeat: no-repeat;
  background-image: url("~@/assets/img/editor/icon-document.svg");
  background-size: contain;
  cursor: pointer;

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-image: url("~@/assets/img/editor/icon-document-hover.svg");
    background-size: contain;
  }

  &--actived {
    background-image: url("~@/assets/img/editor/icon-document-hover.svg");
    cursor: unset;
  }
}

.editor {
  height: 100%;
  display: flex;

  &__block {
    height: 100%;
  }

  &__left-block {
    // padding-right: 10px;
    transition: width ease-in 0.3s;
    // overflow-x: scroll;
    // overflow-y: hidden;
  }

  &__right-block {
    position: relative;
    transition: width ease-in 0.3s;
    // width: 400px;
    background-color: $primary-white;
  }

  .slide {
    animation: slide 0.5s;
  }

  .hide {
    animation: hide 0.5s;
  }

  @keyframes slide {
    0% {
      transform: translateX(450px);
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes hide {
    100% {
      opacity: 0;
      transform: translateX(100%);
    }
  }
}

.reduce-header-height {
  height: calc(
    100% - #{$requester-tabs-header-height} - #{$requester-tabs-header-margin}
  );
}

.add-gap {
  gap: 5px;
}

:deep(.ant-tabs-nav) {
  height: 40px;
}

:deep(.ant-tabs-nav-wrap) {
  padding-left: 6px;
}

:deep(.ant-tabs-content-holder) {
  background-color: $primary-white;
}

:deep(.ant-tabs-tab) {
  top: 3px;
  padding: 6px 16px;
}
</style>

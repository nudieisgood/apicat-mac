<template>
  <!-- 共用提示刪除彈窗-->
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      :title="`DELETE ${deletedData.name}`"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">Are you sure you want to delete?</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button class="" @click="deleteCurrentItem">Delete</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs, getCurrentInstance, computed } from "vue";
import { deleteCollection } from "@/js/ipc/collectionIPC.js";
import { deleteFolder } from "@/js/ipc/folderIPC.js";
import { deleteItem, editItem } from "@/js/ipc/itemIPC.js";
import { deleteEnvironment } from "@/js/ipc/environmentIPC.js";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import { useStore } from "vuex";
import tabsData from "@/store/tabs";
import Helper from "@/js/utils/helper";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    deletedId: {
      type: Number,
      default: null,
    },
    deletedData: {
      type: Object,
      default: () => {},
    },
    treeData: {
      type: Array,
      default: () => [],
    },
  },
  emits: {
    "close-tip-dialog": null,
    "reset-deleted-data": null, // 成功刪除資料後，須將原本傳入欲刪除的資料重置
  },
  setup(props, context) {
    const store = useStore();

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const items = computed(() => {
      return store.getters.getCurrentWorkspaceItems;
    });

    const app = getCurrentInstance();
    const { dialogVisible, deletedId, deletedData } = toRefs(props);
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

    const deleteId = ref("");
    watch(
      deletedId,
      () => {
        deleteId.value = deletedId.value;
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
      store.commit("SET_PROCESSING_MODE", false);
      context.emit("close-tip-dialog");
    };

    const dataType = ref("");

    const deleteCurrentItem = Helper.throttle(async () => {
      store.commit("SET_PROCESSING_MODE", true);
      let res = {};
      let targetItemData = {};

      const id = deletedData.value.id;
      if (dataType.value === TypeEnum.collection.name) {
        const obj = {
          workspaceId: currentWorkspace.value.id,
          collectionsId: id,
        };
        res = await deleteCollection(obj);
      } else if (dataType.value === TypeEnum.folder.name) {
        const obj = {
          workspaceId: currentWorkspace.value.id,
          folderId: id,
        };
        res = await deleteFolder(obj);
      } else if (dataType.value === TypeEnum.item.name) {
        const obj = {
          workspaceId: currentWorkspace.value.id,
          itemsId: id,
        };
        res = await deleteItem(obj);
      } else if (dataType.value === TypeEnum.environment.name) {
        const obj = {
          workspaceId: currentWorkspace.value.id,
          environmentId: id,
        };

        res = await deleteEnvironment(obj);
      } else if (dataType.value === TypeEnum.example.name) {
        targetItemData = tabsData.getCurrentItemData(
          items.value,
          deletedData.value.requestId
        );

        if (targetItemData) {
          const resIndex = targetItemData.response.findIndex(
            (e) => e.id === id
          );
          if (resIndex > -1) {
            targetItemData.response.splice(resIndex, 1);
          }
        }

        // 刪除request response 其中的項目，因此call editItem IPC
        const obj = {
          itemsId: targetItemData.id,
          workspaceId: currentWorkspace.value.id,
          response: targetItemData.response,
        };
        res = await editItem(obj);
      }

      if (res.code === 20000) {
        window.showNotification("success", "Delete successfully.");

        store.commit("DELETE_MULTIPLE_TAB", id);
        context.emit("reset-deleted-data");

        // 刪除example時，若有開啟父層request的tab時，須更新該tab的response
        if (dataType.value === TypeEnum.example.name) {
          updateTabOfTabpane(targetItemData, res);
        }
      } else {
        window.showNotification("warn", res.message);
      }

      closeDialog();
    });

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    const updateTabOfTabpane = (targetItemData, res) => {
      const result = tabsPane.value.find((e) => e.id === targetItemData.id);
      if (result) {
        result.response = targetItemData.response;
      }
    };

    watch(
      deletedData,
      () => {
        if (deletedData.value.tabType === "environment") {
          dataType.value = deletedData.value.tabType;
        } else {
          dataType.value = classifyType(deletedData.value);
        }
      },
      {
        immediate: true,
      }
    );

    return {
      app,
      visible,
      deleteId,
      cancel,
      closeDialog,
      deleteCurrentItem,
      dataType,
      classifyType,
    };
  },
};
</script>

<style lang="scss" scoped>
$headerHeight: 32px;

.modal {
  // &__content {
  //   height: calc(100% - $headerHeight);
  //   max-height: 340px;
  //   // margin-bottom: 20px;
  //   overflow-y: scroll;
  //   // padding-right: 7px;
  // }
  &__message {
    margin-bottom: 24px;
  }
  &__btns {
    display: flex;
    justify-content: flex-end;

    .ant-btn {
      margin-left: 8px;
    }
  }
}
</style>

<template>
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      title="DELETE WORKSPACE"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">Are you sure you want to delete?</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button @click="deleteWorkspaces">Delete</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs } from "vue";
import { deleteWorkspace } from "@/js/ipc/workspaceIPC.js";
import { useStore } from "vuex";
import workspaceData from "@/store/workspace";
import Helper from "@/js/utils/helper";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    workspaceId: {
      type: Number,
      default: null,
    },
  },
  emits: {
    "close-tip-dialog": null,
    // "update-list": null,
    "show-message-dialog": null,
  },
  setup(props, context) {
    const store = useStore();
    const { dialogVisible, workspaceId } = toRefs(props);
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

    const deleteWorkspaces = Helper.throttle(async () => {
      const obj = {
        workspaceId: workspaceId.value,
      };
      const res = await deleteWorkspace(obj);
      if (res.code === 20000) {
        store.commit("DELETE_SINGLE_WORKSPACE", workspaceId.value);
        await workspaceData.getAllWorkspaceList();

        // 若刪掉的是當前的工作區，需要重新取得一筆工作資料
        if (workspaceId.value === store.getters.getSelectedWorkspaceId) {
          store.commit("RESET_WORKSPACE_ID");
          await workspaceData.initWorkspaceData();
        }
      } else if (res.code === 400202) {
        context.emit("show-message-dialog");
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    });

    const cancel = (e) => {
      closeDialog();
    };

    const closeDialog = () => {
      visible.value = false;
      context.emit("close-tip-dialog");
    };

    return {
      visible,
      cancel,
      closeDialog,
      deleteWorkspaces,
    };
  },
};
</script>

<style lang="scss" scoped>
$headerHeight: 32px;

.modal {
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

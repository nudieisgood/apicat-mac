<template>
  <!-- 提示詢問是否加入工作區彈窗-->
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      title="Invitation to Join Workspace"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">
          You've received an invitation to join a workspace.
        </p>
        <p class="modal__message">Would you like to join?</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="decline">Decline</a-button>
          <a-button class="" @click="join">Join</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, watch, toRefs } from "vue";
import { participantConfirm } from "@/js/ipc/participantIPC.js";
import workspaceData from "@/store/workspace";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      default: "",
    },
  },
  emits: {
    "close-dialog": null,
  },
  setup(props, context) {
    const { dialogVisible, inviteCode } = toRefs(props);
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

    const closeDialog = () => {
      context.emit("close-dialog");
    };

    const handleJoinWorkspace = async (arg) => {
      const res = await participantConfirm(arg);
      if (res.code === 20000) {
        if (!arg.decline) {
          window.showNotification("success", "Join successfully!");
        }
        await workspaceData.getAllWorkspaceList();
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    };

    const decline = () => {
      let arg = {
        declined: true,
        inviteCode: inviteCode.value,
      };
      handleJoinWorkspace(arg);
    };

    const join = () => {
      let arg = {
        declined: false,
        inviteCode: inviteCode.value,
      };
      handleJoinWorkspace(arg);
    };

    return {
      visible,
      closeDialog,
      decline,
      join,
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

  &__btns {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;

    .ant-btn {
      margin-left: 8px;
    }
  }
}
</style>

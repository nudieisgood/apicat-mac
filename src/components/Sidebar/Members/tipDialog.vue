<template>
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      title="DELETE MEMBER"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">Are you sure you want to delete?</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button @click="deleteMember">Delete</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs, inject } from "vue";
import { removeParticipant } from "@/js/ipc/participantIPC.js";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    userInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "close-tip-dialog": null,
    "update-participant-list": null,
  },
  setup(props, context) {
    const $message = inject("$message");
    const { dialogVisible, userInfo } = toRefs(props);
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

    const deleteMember = async () => {
      const obj = {
        userId: userInfo.value.userId,
        workspaceId: userInfo.value.workspaceId,
      };

      const res = await removeParticipant(obj);
      if (res.code === 20000) {
        $message.success(res.message);
        context.emit("update-participant-list");
      } else {
        $message.warning(res.message);
      }
      closeDialog();
    };

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
      deleteMember,
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

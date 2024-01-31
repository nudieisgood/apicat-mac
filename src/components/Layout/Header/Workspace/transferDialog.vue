<template>
  <div class="transfer-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      :title="`TRANSFER OWNERSHIP`"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__selector">
          <a-select
            ref="memberSelect"
            :value="selectedUserId"
            placeholder="Select a user"
            @change="handleChange"
          >
            <template v-for="option in participantList" :key="option.userId">
              <a-select-option
                :value="option.userId"
                v-if="option.userId !== userState.id"
                >{{ option.userName }} / {{ option.account }}</a-select-option
              >
            </template>
          </a-select>
        </p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button class="" @click="confirm">Confirm</a-button>
        </div>
      </div>
    </a-modal>
  </div>
  <message-dialog
    v-if="isShowMessageDialog"
    :dialog-visible="isShowMessageDialog"
    @close-message-dialog="hideMessageDialog"
    :workspaceId="selectedId"
    :message="message"
    @show-transfer-dialog="showTransferDialog"
  />
</template>
<script>
import { ref, watch, toRefs, computed } from "vue";
import workspaceData from "@/store/workspace";
import { useStore } from "vuex";
import MessageDialog from "@/components/MessageDialog";

export default {
  components: {
    MessageDialog,
  },
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
    workspaceId: {
      type: Number,
      default: null,
    },
  },
  emits: {
    "close-transfer-dialog": null,
    "show-transfer-dialog": null,
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

    const cancel = (e) => {
      closeDialog();
    };

    const closeDialog = () => {
      visible.value = false;
      context.emit("close-transfer-dialog");
    };

    const confirm = async () => {
      const res = await workspaceData.handleWorkspaceOwner(
        workspaceId.value,
        selectedUserId.value
      );
      // console.log("transfor owner res__", res);
      if (res.code === 20000) {
        window.showNotification(
          "success",
          `Transfer workspace owner successfully.`
        );
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    };

    const selectedUserId = ref(null);

    const handleChange = (value) => {
      selectedUserId.value = value;
    };

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    const participantList = computed(() => {
      return store.getters.getParticipantList;
    });

    return {
      visible,
      cancel,
      closeDialog,
      confirm,
      selectedUserId,
      handleChange,
      userState,
      participantList,
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
  &__selector {
    margin-bottom: 24px;

    .ant-select {
      width: 100%;
    }
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

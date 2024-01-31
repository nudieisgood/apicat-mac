<template>
  <div class="edit-modal-wrapper">
    <a-modal
      v-model:open="visible"
      title="Edit Information"
      class="edit-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form ref="editFormRef" :model="formState">
          <a-form-item ref="userName" label="Name:" name="userName">
            <span v-text="formState.userName" />
          </a-form-item>
          <a-form-item ref="account" label="Account:" name="account">
            <span v-text="formState.account" />
          </a-form-item>
          <a-form-item ref="editable" label="Admin:" name="editable">
            <a-radio-group name="radioGroup" v-model:value="formState.editable">
              <a-radio :value="true">Yes</a-radio>
              <a-radio :value="false">No</a-radio>
            </a-radio-group>
            <!-- <p class="mark" v-if="formState.editable">Can manage workspace details and members.</p> -->
            <p class="mark" v-if="formState.editable">Can manage members.</p>
            <p class="mark" v-else>Can view, and export workspace resource.</p>
          </a-form-item>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
            <a-button class="btn-submit" @click="edit">Confirm</a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { onMounted, ref, watch, toRefs, reactive } from "vue";
import { editParticipant } from "@/js/ipc/participantIPC.js";
import store from "@/store";

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
    "close-edit-dialog": null,
    "update-participant-list": null,
  },
  components: {},
  setup(props, context) {
    const { dialogVisible, userInfo } = toRefs(props);

    const editFormRef = ref();
    const formState = reactive({
      // email: '',
      // editable: undefined
    });

    const edit = async () => {
      const obj = {
        userId: userInfo.value.userId,
        workspaceId: userInfo.value.workspaceId,
        isEditable: formState.editable.toString(),
      };

      const res = await editParticipant(obj);

      if (res.code === 20000) {
        window.showNotification("success", "Edit successfully.");
        context.emit("update-participant-list");
        if (userInfo.value.isCurrentUser) {
          store.commit("UPDATE_USER_EDIT_RIGHT", res.data.editable);
        }
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();

      // loading.value = false
    };

    const cancel = (e) => {
      closeDialog();
    };

    // 彈窗顯示與否
    const visible = ref(false);
    const closeDialog = () => {
      visible.value = false;
      context.emit("close-edit-dialog");
    };

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    watch(
      userInfo,
      () => {
        formState.userName = userInfo.value.userName;
        formState.account = userInfo.value.account;
        formState.editable = userInfo.value.editable;
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {});

    return {
      visible,
      editFormRef,
      formState,
      edit,
      cancel,
      closeDialog,
    };
  },
};
</script>
<style lang="scss" scoped>
.modal {
  &__content {
    max-height: 340px;

    .mark {
      margin-top: 2px;
      margin-bottom: 0;
      color: #adadad;
      font-size: 12px;
    }

    .form-btns {
      width: fit-content;
      margin: 32px 0 0 auto;
    }

    .btn-submit {
      margin-right: 10px;
    }

    .btn-cancel {
      margin-right: 10px;
    }

    &:deep(.ant-form-item) {
      align-items: baseline;
    }

    &:deep(.ant-form-item-label) {
      flex-basis: 15%;
      margin-right: 8px;
      text-align: left;
    }
  }
}
</style>

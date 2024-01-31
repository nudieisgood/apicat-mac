<template>
  <div class="invite-modal-wrapper">
    <a-modal
      v-model:open="visible"
      title="Invite people to this workspace"
      class="invite-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form ref="inviteFormRef" :model="formState" :rules="rules">
          <a-form-item ref="type" label="Type" name="type">
            <a-radio-group
              name="typeGroup"
              v-model:value="formState.notificationType"
            >
              <a-radio value="websocket">websocket</a-radio>
              <a-radio value="email">E-mail</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item ref="email" label="Email" name="email">
            <a-input v-model:value="formState.identifier" />
          </a-form-item>
          <a-form-item ref="isEditable" label="Admin" name="isEditable">
            <a-radio-group
              name="radioGroup"
              v-model:value="formState.isEditable"
            >
              <a-radio value="true">Yes</a-radio>
              <a-radio value="false">No</a-radio>
            </a-radio-group>
            <p class="mark" v-if="formState.isEditable === 'true'">
              Can manage workspace details and members.
            </p>
            <p class="mark" v-else>Can view, and export workspace resource.</p>
          </a-form-item>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
            <a-button
              class="btn-submit"
              @click="beforeInvite"
              :disabled="!formState.identifier"
              :loading="isLoading"
              >Send Invites</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { onMounted, ref, watch, toRefs, reactive, computed, inject } from "vue";
import { inviteParticipant } from "@/js/ipc/participantIPC.js";

import store from "@/store";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    participantList: {
      type: Array,
      default: () => [],
    },
  },
  emits: {
    "close-invite-dialog": null,
    "update-participant-list": null,
  },
  components: {},
  setup(props, context) {
    const { dialogVisible, participantList } = toRefs(props);
    const $message = inject("$message");

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const inviteFormRef = ref();
    const formState = reactive({
      identifier: "",
      isEditable: "false",
      workspaceId: currentWorkspace.value.id,
      notificationType: "websocket",
    });

    const rules = {
      identifier: [
        {
          required: true,
          message: "Please enter a email.",
          trigger: "blur",
        },
      ],
    };

    const isLoading = ref(false);

    const beforeInvite = () => {
      const isInvited = participantList.value.some(
        (e) => e.account === formState.identifier
      );

      if (isInvited) {
        $message.warning("The member already exists in the current workspace.");
        return;
      }
      invite();
    };

    const invite = () => {
      inviteFormRef.value
        .validate()
        .then(async () => {
          isLoading.value = true;
          const submitData = JSON.parse(JSON.stringify(formState));
          const res = await inviteParticipant(submitData);
          isLoading.value = false;

          if (res.code === 20000) {
            window.showNotification("success", "Invite successfully.");
            context.emit("update-participant-list");
          } else {
            window.showNotification("warn", res.message);
          }
          closeDialog();
        })
        .catch((error) => {
          console.log("error", error);
          isLoading.value = false;
        });
    };

    const cancel = (e) => {
      closeDialog();
    };

    // 彈窗顯示與否
    const visible = ref(false);
    const closeDialog = () => {
      visible.value = false;
      context.emit("close-invite-dialog");
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

    onMounted(() => {});

    return {
      visible,
      inviteFormRef,
      formState,
      rules,
      invite,
      cancel,
      closeDialog,
      isLoading,
      beforeInvite,
    };
  },
};
</script>
<style lang="scss" scoped>
.modal {
  &__content {
    .form-btns {
      width: fit-content;
      margin: 32px 0 0 auto;
    }

    .btn-submit {
      margin-right: 10px;
    }

    .mark {
      margin-top: 2px;
      margin-bottom: 0;
      color: #adadad;
      font-size: 12px;
    }

    &:deep(.ant-form-item) {
      align-items: baseline;
      margin-bottom: 4px;
    }

    &:deep(.ant-form-item-label) {
      flex-basis: 15%;
      margin-right: 8px;
      text-align: left;

      label {
        font-size: 13px;
      }
    }

    &:deep(.ant-btn) {
      &.btn-cancel {
        margin-right: 8px;
      }

      &:hover {
        background: $primary-blue;
      }

      &[disabled] {
        &:hover {
          background: transparent;
        }
      }
    }
  }
}
</style>

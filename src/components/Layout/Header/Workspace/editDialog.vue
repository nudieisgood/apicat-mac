<template>
  <div class="workspace-modal-wrapper">
    <a-modal
      v-model:open="visible"
      title="Edit workspaces"
      class="workspace-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form :model="formState" layout="vertical">
          <a-form-item ref="name" label="Name" name="name">
            <a-input v-model:value="formState.workspaceName" />
          </a-form-item>
          <a-form-item ref="summary" label="Summary" name="summary">
            <a-textarea
              v-model:value="formState.summary"
              :autoSize="{ minRows: 3, maxRows: 3 }"
            />
          </a-form-item>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="closeDialog">Cancel</a-button>
            <a-button
              class="btn-submit"
              @click="onEditWorkspace"
              :disabled="!formState.workspaceName && !formState.summary"
              >Edit Workspace</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { onMounted, ref, watch, toRefs, reactive } from "vue";
import { editWorkspace, getWorkspace } from "@/js/ipc/workspaceIPC.js";
import workspaceData from "@/store/workspace";

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
    "close-edit-dialog": null,
  },
  components: {},
  setup(props, context) {
    const { dialogVisible, workspaceId } = toRefs(props);

    const formState = reactive({
      workspaceName: "",
      summary: "",
    });

    const onEditWorkspace = async () => {
      const submitData = JSON.parse(JSON.stringify(formState));
      submitData.workspaceId = workspaceId.value;
      const res = await editWorkspace(submitData);

      if (res.code === 20000) {
        await workspaceData.getAllWorkspaceList();
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    };

    // 彈窗顯示與否
    const visible = ref(false);
    const closeDialog = () => {
      context.emit("close-edit-dialog");
    };

    watch(
      dialogVisible,
      async () => {
        if (workspaceId.value) {
          const obj = {
            workspaceId: workspaceId.value,
          };
          const res = await getWorkspace(obj);
          if (res.code === 20000) {
            formState.workspaceName = res.data.workspace.name;
            formState.summary = res.data.workspace.summary;
          }
        }
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {});

    return {
      visible,
      formState,
      onEditWorkspace,
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
      margin-top: -5px;
      margin-bottom: 0;
      color: #adadad;
      font-size: 12px;
    }

    .form-btns {
      width: fit-content;
      margin: 32px 0 0 auto;
    }

    .btn-submit {
      margin-left: 10px;
    }

    .btn-cancel {
      background: transparent;
      color: #0066cc;
      border: unset;
    }
  }
}
</style>

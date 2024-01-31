<template>
  <div class="workspace-modal-wrapper">
    <a-modal
      v-model:open="visible"
      title="Create workspaces"
      class="workspace-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form
          ref="createFormRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
        >
          <a-form-item ref="name" label="Name" name="name">
            <a-input v-model:value="formState.workspaceName" />
          </a-form-item>
          <a-form-item ref="summary" label="Summary" name="summary">
            <p class="mark">Add a brief summary about this workspace.</p>
            <a-textarea
              v-model:value="formState.summary"
              :autoSize="{ minRows: 3, maxRows: 3 }"
            />
          </a-form-item>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="closeDialog">Cancel</a-button>
            <a-button
              class="btn-submit"
              @click="create"
              :disabled="!formState.workspaceName && !formState.summary"
              >Create Workspace</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { onMounted, ref, watch, toRefs, reactive } from "vue";
import { createWorkspace } from "@/js/ipc/workspaceIPC.js";
import workspaceData from "@/store/workspace";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-create-dialog": null,
    "change-workspace": null,
  },
  components: {},
  setup(props, context) {
    const { dialogVisible } = toRefs(props);

    const createFormRef = ref();
    const formState = reactive({
      workspaceName: "",
      summary: "",
    });

    const rules = {
      workspaceName: [
        {
          required: true,
          message: "Please enter a workspaceName.",
          trigger: "blur",
        },
      ],
    };

    const create = () => {
      createFormRef.value
        .validate()
        .then(async () => {
          const submitData = JSON.parse(JSON.stringify(formState));
          const res = await createWorkspace(submitData);

          if (res.code === 20000) {
            const obj = {
              key: res.data.id,
            };

            await workspaceData.getAllWorkspaceList();
            context.emit("change-workspace", obj);
            closeDialog();
          } else {
            window.showNotification("warn", res.message);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
    };

    // 彈窗顯示與否
    const visible = ref(false);
    const closeDialog = () => {
      context.emit("close-create-dialog");
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
      createFormRef,
      formState,
      rules,
      create,
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

      &:hover {
        background: $primary-blue;
      }
    }

    .btn-submit[disabled] {
      border-color: $secondary-light-grey;
      color: $secondary-light-grey;
      &:hover {
        background: unset;
        border-color: $secondary-light-grey;
        color: $secondary-light-grey;
      }
    }
  }
}
</style>

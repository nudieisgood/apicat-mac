<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="IMPORT COLLECTION"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form ref="importFormRef" layout="vertical">
          <a-radio-group v-model:value="workspaceId" :options="workspaceList" />
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="closeDialog">Cancel</a-button>
            <a-button
              class="btn-submit"
              @click="importHtml"
              :disabled="!workspaceId"
              >Import</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, toRefs, watch } from "vue";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    workspaceList: {
      type: Array,
      default: () => [],
    },
  },
  emits: {
    "close-import-dialog": null,
    "import-html": null,
  },
  setup(props, context) {
    const visible = ref(false);
    const { dialogVisible } = toRefs(props);
    const workspaceId = ref(null);

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
      context.emit("close-import-dialog");
    };

    const importHtml = () => {
      context.emit("import-html", workspaceId.value);
      closeDialog();
    };

    return {
      visible,
      workspaceId,
      closeDialog,
      importHtml,
    };
  },
};
</script>

<style lang="scss" scoped>
$form-btns-height: 32px;
$form-btns-margin: 32px;

.modal {
  &__content {
    height: 340px;

    &:deep(.ant-form) {
      height: 100%;
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

    .import-file-list {
      &__row {
        .file-name {
          margin-left: 6px;
        }
      }
    }

    &:deep(.ant-form-item-control-input-content) {
      display: flex;
    }
  }
}

.ant-radio-group {
  display: flex;
  flex-direction: column;
  height: calc(100% - #{$form-btns-height} - #{$form-btns-margin});
  overflow-y: scroll;
}

// .ant-radio-button-wrapper:not(:first-child)::before {
//   width: 0;
// }

:deep(.ant-radio-wrapper) {
  &:not(:last-child) {
    margin-bottom: 6px;
  }
}
</style>

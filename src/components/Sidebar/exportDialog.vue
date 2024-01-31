<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="EXPORT COLLECTION"
      class="export-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <span class="collection-name">{{ collectionInfo.name }}</span>
        <span> will be：</span>
        <a-form ref="importFormRef" :model="formState" layout="vertical">
          <a-form-item>
            <a-radio-group v-model:value="formState.fileType">
              <a-radio value="json">Export as JSON file</a-radio>
              <a-radio value="html">Export as HTML file</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
            <a-button class="btn-submit" @click="onExport">Export</a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { watch, toRefs, ref, reactive, computed } from "vue";
import { exportCollection, downloadHtmlFile } from "@/js/ipc/collectionIPC.js";
import store from "@/store";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    collectionInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "close-export-dialog": null,
  },
  setup(props, context) {
    // const app = getCurrentInstance()
    const { dialogVisible, collectionInfo } = toRefs(props);
    const visible = ref(false);

    const formState = reactive({
      fileType: "json",
    });

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
      context.emit("close-export-dialog");
    };

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const onExport = async () => {
      const obj = {
        collectionsId: collectionInfo.value.id,
        workspaceId: currentWorkspace.value.id,
      };

      if (formState.fileType === "json") {
        await exportCollection(obj);
      } else {
        await downloadHtmlFile(obj);
      }
      closeDialog();
    };

    return {
      formState,
      visible,
      cancel,
      onExport,
      closeDialog,
    };
  },
};
</script>

<style lang="scss" scoped>
.modal {
  &__content {
    max-height: 340px;

    .collection-name {
      font-weight: 600;
    }

    &:deep(.ant-form-item) {
      margin-top: 8px;
    }

    &:deep(.ant-radio-wrapper) {
      display: block;
      margin-top: 4px;
      margin-left: 12px;
    }

    .form-btns {
      width: fit-content;
      margin: 16px 0 0 auto;
    }

    .btn-submit {
      margin-right: 10px;
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

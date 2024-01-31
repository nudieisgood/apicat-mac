<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="IMPORT"
      class="workspace-modal"
      width="450px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <a-form ref="importFormRef" layout="vertical">
          <a-form-item name="file" v-if="!fileList.length">
            <a-upload
              v-model:file-list="fileList"
              name="file"
              :multiple="false"
              :showUploadList="false"
              action="#"
              :custom-request="uploadFile"
            >
              <a-button class="btn-import"
                ><upload-outlined /> Click to Upload
              </a-button>
            </a-upload>
          </a-form-item>
          <div class="import-file-list" v-if="fileList.length > 0">
            <div class="import-file-list__row">
              <file-text-outlined />
              <span class="file-name">{{ fileList[0].name }}</span>
            </div>
          </div>
          <a-form-item class="form-btns">
            <a-button class="btn-cancel" @click="closeDialog">Cancel</a-button>
            <a-button class="btn-submit" @click="importJson">Import</a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { watch, toRefs, ref, inject, computed } from "vue";
import { importCollection } from "@/js/ipc/collectionIPC.js";
import Helper from "@/js/utils/helper";
import store from "@/store";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-import-dialog": null,
  },
  setup(props, context) {
    const $message = inject("$message");
    const { dialogVisible } = toRefs(props);

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const visible = ref(false);
    const fileList = ref([]);

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    const importJson = Helper.throttle(async () => {
      if (!jsonFile.value) {
        $message.warning("Please select a file.");
        return;
      }
      store.commit("SET_PROCESSING_MODE", true);
      const data = {
        files: jsonFile.value,
        workspaceId: currentWorkspace.value.id,
      };

      const res = await importCollection(data);

      if (res.code === 20000) {
        window.showNotification("success", "Import successfully.");
      } else {
        window.showNotification("warn", res.message);
      }
      closeDialog();
    });

    const jsonFile = ref(null);

    const uploadFile = async (info) => {
      checkAndHandleFile(info.file);
    };

    const checkAndHandleFile = (file) => {
      const reader = new FileReader();
      reader.onload = function () {
        const content = reader.result;
        const hasUnicodeNull = /\\u0000/.test(content);
        if (hasUnicodeNull) {
          // 處理unicode u0000
          const newContent = content.replace(/\\u0000/g, "\\u0003");
          // console.log('newContent__', newContent)
          // const blob = new Blob([newContent], { type: file.type })
          // const modifiedFile = new File([blob], file.name, {
          //   lastModified: file.lastModified,
          //   type: file.type
          // })
          // console.log('newfiedFile__', modifiedFile)
          jsonFile.value = newContent;
        } else {
          jsonFile.value = reader.result;
        }
      };

      reader.readAsText(file);
    };

    const closeDialog = () => {
      visible.value = false;
      store.commit("SET_PROCESSING_MODE", false);
      context.emit("close-import-dialog");
    };

    return {
      visible,
      importJson,
      uploadFile,
      closeDialog,
      jsonFile,
      fileList,
    };
  },
};
</script>

<style lang="scss" scoped>
.modal {
  &__content {
    max-height: 340px;

    .form-btns {
      width: fit-content;
      margin: 32px 0 0 auto;
    }

    .btn-cancel {
      margin-right: 8px;
    }

    .import-file-list {
      &__row {
        .file-name {
          margin-left: 6px;
        }
      }
    }

    .btn-import {
      &:hover {
        .anticon {
          color: $primary-white;
        }
      }
    }
  }
}
</style>

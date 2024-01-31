<template>
  <div class="documentation-wrapper">
    <div class="documentation-header">
      <p class="documentation-header__title">Documentation</p>
      <p class="documentation-header__icon-close" @click="hideDocument" />
    </div>
    <div class="documentation-context">
      <div class="request-url" v-if="currentInfo.request?.url?.raw && !isShowEditorBox"> {{ currentInfo.request?.url?.raw
      }} </div>
      <div class="description">
        <template v-if="!isShowEditorBox">
          <div class="loader" v-if="loading">
            <div class="loader-wrapper" v-for="(n, index) in 3" :key="index">
              <free-style-shimmer v-for="(n, index) in loaderList" :key="index" :is-loading="true" height="16px"
                :width="n.width" border-radius="5px" color="#E0E0E0" />
            </div>
            <div class="loader-wrapper">
              <free-style-shimmer :is-loading="true" height="250px" width="300px" border-radius="5px" color="#E0E0E0" />
            </div>
          </div>
          <div class="description-preview">
            <span class="description-preview__placeholder" v-if="!currentDesc">Make things easier for your teammates with
              a complete request description.</span>
            <span class="description-preview__current-desc markdown-body" v-else v-html="currentDesc" />
            <span class="description-preview__edit-icon" @click="showEditorBox" />
          </div>
          <div class="request-body-preview" v-if="currentInfo.tabType === TypeEnum.item.name">
            <div class="request-body-preview__header">
              <div class="request-body-preview__title">Body</div>
              <div class="request-body-preview__sub-title"> {{ handleSubTitle(currentInfo) }} </div>
            </div>
            <div class="request-body-preview__container">
              <div class="request-body-preview__formdata-content" v-if="currentInfo.request.body.mode ===
                DataTypeEnum.MULTIPART_FORMDATA.dataType
                ">
                <div class="formdata-content__row" v-for="item in currentInfo.request.body.formdata" :key="item.id">
                  <div class="formdata-content__col formdata-content__key"> {{ item.key }} </div>
                  <div class="formdata-content__col formdata-content__value"> {{ item.type === "text" ? item.value :
                    item.stringList }} </div>
                </div>
              </div>
              <div class="request-body-preview__raw-content" v-else-if="currentInfo.request.body.mode ===
                DataTypeEnum.APPLICATION_JSON.dataType
                ">
                <div class="raw-content">
                  <div class="raw-content__icon-copy" @click="copy">
                    <copy-outlined />
                  </div>
                  <textarea :value="currentInfo.request.body.raw" readonly ref="textareaRef"></textarea>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="description-editor-box" v-else>
          <div class="description-editor__header">
            <a-button :class="{ 'is-actived': isShowEditor }" @click="isShowEditor = true">Markdown</a-button>
            <a-button :class="{ 'is-actived': !isShowEditor }" @click="compiledMarkdown">Preview</a-button>
          </div>
          <div class="description-editor__container">
            <div class="editor" v-show="isShowEditor">
              <textarea placeholder="Instant Markdown styling is supported." :value="markdownInput" @input="updateText" />
            </div>
            <div class="description-editor__preview" v-show="!isShowEditor">
              <div class="description-editor__compiled-value markdown-body" v-html="compiledValue" ref="compiledValueBox">
              </div>
            </div>
          </div>
          <div class="description-editor__footer">
            <a-button class="" @click="saveInfo">Save</a-button>
            <a-button @click="cancel">Cancel</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  ref,
  toRefs,
  watch,
  getCurrentInstance,
  onBeforeUnmount,
  nextTick,
  reactive,
  computed,
  inject,
} from "vue";
import { marked } from "marked";
import workspaceData from "@/store/workspace";
import TypeEnum from "@/js/enum/typeEnum.js";
import { editCollection } from "@/js/ipc/collectionIPC.js";
import { editFolder } from "@/js/ipc/folderIPC.js";
import { editItem } from "@/js/ipc/itemIPC.js";
import Helper from "@/js/utils/helper";
import { useStore } from "vuex";
import DataTypeEnum from "@/js/enum/dataTypeEnum";

const TurndownService = require("turndown").default;

const tables = require("turndown-plugin-gfm").tables;
const turndownService = new TurndownService({ headingStyle: "atx" });
turndownService.keep(["u"]); // 保留下底線標籤
turndownService.use(tables);

/**
 * 刪除線格式設定
 * 輸出格式:<del>content</del> 轉 ~~content~~
 */
turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: (content) => {
    return `~~${content}~~`;
  },
});

/**
 * 連結格式設定
 * 輸出格式:[link text](https:// "title")
 */
turndownService.addRule("link", {
  filter: ["a"],
  replacement: (content, node, options) => {
    return `[${content}](${node.getAttribute("href")})`;
  },
});

marked.options({
  breaks: true, // If true, add <br> on a single line break
});

// const electron = window.require("electron");
// const clipboard = electron.clipboard;
const { clipboard } = require('electron');
// import { clipboard } from "electron"

export default {
  name: "documentation",
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "hide-document": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const store = useStore();
    const app = getCurrentInstance();
    const { tabInfo } = toRefs(props);
    const isShowEditorBox = ref(false);
    const isShowEditor = ref(true);
    const markdownInput = ref("");
    const currentDesc = ref("");

    const updateText = (e) => {
      markdownInput.value = e.target.value;
      compiledValue.value = marked.parse(markdownInput.value);
    };

    const compiledValue = ref("");
    const compiledValueBox = ref(null);

    const compiledMarkdown = () => {
      const reg = /<a /g;
      compiledValue.value = compiledValue.value.replace(
        reg,
        '<a target="_blank" '
      );
      isShowEditor.value = false;
    };

    const showEditorBox = () => {
      isShowEditorBox.value = true;
      isShowEditor.value = true;
    };

    const currentInfo = ref({});
    const loading = ref(false);
    const saveInfo = Helper.throttle(() => {
      checkTypeToUpdateData();
    });

    const checkTypeToUpdateData = async () => {
      loading.value = true;
      const id = tabInfo.value.id;
      let res = {};

      if (tabInfo.value.tabType === TypeEnum.collection.name) {
        const obj = {
          collectionsId: id,
          description: compiledValue.value,
          workspaceId: workspaceData.workspace.workspaceId,
        };
        res = await editCollection(obj);
      } else if (tabInfo.value.tabType === TypeEnum.folder.name) {
        const obj = {
          folderId: id,
          description: compiledValue.value,
          workspaceId: workspaceData.workspace.workspaceId,
        };
        res = await editFolder(obj);
      } else if (tabInfo.value.tabType === TypeEnum.item.name) {
        const request = Object.assign({}, tabInfo.value.request);
        request.description = compiledValue.value;
        const obj = {
          itemsId: id,
          request,
          workspaceId: workspaceData.workspace.workspaceId,
        };
        res = await editItem(obj);
      }

      if (res.code === 20000) {
        if (
          tabInfo.value.tabType === TypeEnum.collection.name ||
          tabInfo.value.tabType === TypeEnum.folder.name
        ) {
          currentInfo.value.description = res.data.description;
        } else {
          currentInfo.value.request.description = res.data.request.description;
        }
        store.commit("UPDATE_TAB", currentInfo.value);
      }

      // loading.value = false
      isShowEditorBox.value = false;
    };

    const cancel = () => {
      markdownInput.value = turndownService.turndown(currentDesc.value);
      compiledValue.value = marked.parse(markdownInput.value);
      isShowEditor.value = true;
      isShowEditorBox.value = false;
    };

    watch(
      tabInfo,
      () => {
        if (tabInfo.value.isEditing) {
          // 編輯tab內容時，等按下儲存才將變動後資料更新至documentation
          return;
        }
        currentInfo.value = JSON.parse(JSON.stringify(tabInfo.value));
        if (
          tabInfo.value.tabType === TypeEnum.collection.name ||
          tabInfo.value.tabType === TypeEnum.folder.name
        ) {
          if (tabInfo.value.description) {
            currentDesc.value = marked.parse(tabInfo.value.description);
            // markdownInput.value = turndownService.turndown(currentDesc.value)
          } else {
            currentDesc.value = marked.parse("");
          }
        } else {
          if (tabInfo.value.request?.description) {
            currentDesc.value = marked.parse(tabInfo.value.request.description);
          } else {
            currentDesc.value = marked.parse("");
          }
          // markdownInput.value = turndownService.turndown(currentDesc.value)
        }
        markdownInput.value = turndownService.turndown(currentDesc.value);
        compiledValue.value = currentDesc.value;
        nextTick(() => {
          if (loading.value) {
            // loading.value = false
          }
        });
      },
      {
        immediate: true,
        deep: true,
      }
    );

    if (app) {
      $bus.on("resetEditorBoxStatus", () => {
        isShowEditorBox.value = false;
        isShowEditor.value = true;
      });
    }

    onBeforeUnmount(() => {
      $bus.off("resetEditorBoxStatus");
    });

    const hideDocument = () => {
      context.emit("hide-document", false);
    };

    const handleSubTitle = (currentTabInfo) => {
      let subTitle = "";
      if (
        currentTabInfo.request.body.mode ===
        DataTypeEnum.MULTIPART_FORMDATA.dataType
      ) {
        subTitle = "form-data";
      } else if (
        currentTabInfo.request.body.mode ===
        DataTypeEnum.APPLICATION_JSON.dataType
      ) {
        subTitle = "raw (json)";
      }
      return subTitle;
    };

    const textareaRef = ref();

    const copy = () => {
      const dom = textareaRef.value;
      clipboard.writeText(dom.value);
    };

    const loaderList = reactive([
      {
        width: "250px",
      },
      {
        width: "200px",
      },
      {
        width: "150px",
      },
    ]);

    const isAPIProcessing = computed(() => {
      return store.getters.isAPIProcessing;
    });

    watch(
      () => isAPIProcessing,
      (newVal, oldVal) => {
        if (!isAPIProcessing.value) {
          loading.value = false;
        }
      },
      {
        immediate: true,
      }
    );

    return {
      markdownInput,
      compiledMarkdown,
      isShowEditor,
      compiledValue,
      updateText,
      isShowEditorBox,
      currentInfo,
      saveInfo,
      currentDesc,
      turndownService,
      cancel,
      showEditorBox,
      loading,
      checkTypeToUpdateData,
      compiledValueBox,
      hideDocument,
      handleSubTitle,
      TypeEnum,
      DataTypeEnum,
      copy,
      textareaRef,
      loaderList,
    };
  },
};
</script>
<style lang="scss" scoped>
$documentation-header-height: 30px;
$request-url-height: 30px;
$request-url-margin: 16px;
$description-header-height: 30px;
$description-editor-header-height: 40px;
$description-editor-header-margin: 16px;
$description-editor-footer-margin: 16px;

.documentation-wrapper {
  position: relative;
  right: 0;
  height: 100%;
  // margin-top: 10px;
  padding: 20px 0 0 36px;
  border-top: 1px solid $secondary-light-grey;
  border-left: 1px solid $secondary-light-grey;
  border-radius: 4px 0 0 0;

  &:deep(ul) {
    padding-left: 20px;
  }
}

.documentation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__icon-close {
    width: 20px;
    height: 20px;
    margin-right: 9px;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/editor/icon-close.png");
    cursor: pointer;

    &:hover {
      background-position-y: center;
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/editor/icon-close-hover.png");
    }
  }
}

.documentation-context {
  height: calc(100% - #{$documentation-header-height});
  padding-right: 5px;
  overflow-y: scroll;
}

.request-url {
  margin-bottom: 12px;
  padding: 4px 8px;
  border-radius: 3px;
  background-color: #dbdbdb;
  font-size: $text-size-m;
}

.description {
  height: calc(100% - #{$request-url-height} - #{$request-url-margin});
}

.description-preview {
  position: relative;
  display: flex;
  justify-content: space-between;
  flex: 1;
  gap: 10px;

  &__placeholder {
    flex-basis: 80%;
    color: #a4a4a4;
  }

  &__edit-icon {
    position: sticky;
    top: 0;
    right: 0;
    width: 16px;
    height: 16px;
    opacity: 0;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/editor/icon-edit.png");
    cursor: pointer;

    &:hover {
      background-position-y: center;
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/editor/icon-edit-hover.png");
    }
  }

  &__current-desc {
    flex: 1;
  }

  &:hover {
    .description-preview__edit-icon {
      // display: block;
      opacity: 1;
    }
  }
}

.description-editor-box {
  height: calc(100% - #{$description-header-height});
  max-height: 450px;
  border: 1px solid #f0f0f0;
}

.description-editor {
  &__header {
    height: $description-editor-header-height;
    margin-bottom: $description-editor-header-margin;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);

    .ant-btn {
      height: 100%;
      border: none;

      &:focus {
        outline: none;
      }
    }

    .is-actived {
      color: $primary-blue;
      // border-bottom: 2px solid #FF9224;
    }
  }

  &__container {
    height: calc(100% - #{$description-editor-header-height} - #{$description-editor-header-margin});
  }

  &__preview {
    height: 100%;
    overflow-y: scroll;
    // height: calc(100% - #{$description-editor-header-height});
  }

  &__compiled-value {
    padding: 0 14px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: $description-editor-footer-margin;
    margin-bottom: $description-editor-footer-margin;

    .ant-btn {
      margin-left: 16px;
    }
  }
}

.editor {
  height: 100%;

  textarea {
    width: 100%;
    height: 100%;
    padding: 0 14px 14px;
    border: none;
    resize: none;
    font-size: $text-size-m;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: #c8c8c8;
    }
  }
}

.request-body-preview {
  margin-top: 10px;
  max-height: 300px;
  overflow-y: scroll;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__title {
    color: $primary-black;
    font-weight: 600;
  }

  &__sub-title {
    font-size: 12.5px;
    color: $primary-dark-grey;
    font-weight: 600;
  }
}

.formdata-content {
  &__row {
    display: flex;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid $secondary-light-grey;
    font-size: 13px;
  }

  &__key {
    flex-basis: 35%;
    color: $primary-black;
    font-weight: 600;
  }

  &__value {
    flex: 1;
    word-break: break-all;
  }
}

.raw-content {
  position: relative;
  height: 250px;
  border: 1px solid $secondary-light-grey;
  border-radius: 6px;

  &__icon-copy {
    position: absolute;
    top: 8px;
    right: 12px;
    cursor: pointer;

    &:deep(.anticon) {
      font-size: 16px;
    }
  }

  textarea {
    padding: 12px;
  }
}

.loader {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: $primary-white;
  z-index: 2;

  &:deep(.shimmer) {
    margin-bottom: 10px;
  }
}

.loader-wrapper {
  margin-bottom: 25px;
}
</style>

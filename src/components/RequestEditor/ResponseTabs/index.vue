<template>
  <div class="response-loading" v-if="tabInfo.isSendingRequest">
    <div class="response-loading__message">Sending request...</div>
    <a-spin />
    <a-button class="response-loading__cancel-button" @click="cancelRequest"
      >Cancel Request</a-button
    >
  </div>

  <!-- 未發送請求前，tabInfo.tempResponse為null -->
  <div class="no-data" v-if="!tabInfo.tempResponse">
    <div class="no-data__header">
      <span>Response</span>
    </div>
    <div class="no-data__content">
      <p>Enter the URL and click Send to get a response</p>
    </div>
  </div>
  <!-- 發送請求後，請求有誤 -->
  <div
    class="response-error"
    v-else-if="tabInfo.tempResponse.status < 0 || !tabInfo.tempResponse.status"
  >
    <div class="response-error__header">
      <span>Response</span>
    </div>
    <div class="response-error__content" v-if="tabInfo.tempResponse">
      <div class="error-image">
        <img :src="require('@/assets/img/image-error.jpg')" alt="" />
      </div>
      <p class="error-message">
        {{
          tabInfo.tempResponse.code === "ENOTFOUND"
            ? `Could not send request`
            : `Could not get response`
        }}
      </p>

      <p class="error-text mark">{{ tabInfo.tempResponse.data }}</p>
    </div>
  </div>
  <!-- 發送請求後，請求成功 -->
  <div
    id="response-tabs"
    v-else
    :class="{
      'row-style': !isVerticalMode || isChangeHeaderStyle,
    }"
  >
    <div class="response-tabs-header">
      <div class="tabs-list">
        <div
          class="tabs-list__item"
          v-for="tab in tabList"
          :key="tab.key"
          @click="changeTab(tab)"
          :class="{
            'tabs-list__item--is-active': currentTabName === tab.tabName,
          }"
        >
          <span class="tabs-list__item-name">{{ tab.tabName }}</span>
        </div>
      </div>
      <div class="state">
        <div class="state__row">
          <span class="state__label">Status:</span>
          <span class="state__value" v-if="tabInfo.tempResponse.status"
            >{{ tabInfo.tempResponse.status }} {{ statusText }}</span
          >
        </div>
        <div class="state__row">
          <span class="state__label">Time:</span>
          <span class="state__value" v-if="tabInfo.tempResponse.time"
            >{{ tabInfo.tempResponse.time }} ms</span
          >
        </div>
        <div class="state__row">
          <span class="state__label">Size:</span>
          <span class="state__value" v-if="formatSize">{{ formatSize }} B</span>
        </div>
        <div
          class="response-action"
          :class="{ 'response-action--trigger-hover': isMediaResponse }"
        >
          <div class="response-action__save-as-example">
            <a-button
              class="response-action-btn"
              :disabled="isMediaResponse"
              @click="saveAsExample"
            >
              Save as example
            </a-button>
            <p class="response-action-tooltip">
              Can't save example for media type response.
            </p>
          </div>
          <div class="response-action__others">
            <a-dropdown :trigger="['click']">
              <a class="response-action__list-icon" @click.prevent>
                <EllipsisOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="(action, index) in actionOptions"
                    :key="index"
                    class="response-action__option"
                    @click="onSelect(action.type)"
                  >
                    {{ action.label }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </div>
    <div class="response-tabs-pane" :style="{ height: panesHeight }">
      <div class="response-tabs-pane__content" v-if="currentTabName === 'Body'">
        <div class="body-container">
          <div
            class="body-container__image-block body-container__block"
            v-if="isMediaResponse"
          >
            <img
              v-if="base64Data"
              :src="`data:image/bmp;base64,${base64Data}`"
            />
            <img v-if="imageUrl" :src="imageUrl" />
          </div>
          <div
            class="body-container__editor-block body-container__block"
            v-else
          >
            <editor
              v-model="bodyCode"
              :model-value="bodyCode"
              @update:modelValue="bodyCode = $event"
              :read-only="true"
              :content-type="currentContentType"
              key="response-editor"
              :tab-info="tabInfo"
            >
              <p>{{ bodyCode }}</p>
            </editor>
          </div>
        </div>
      </div>
      <div
        class="response-tabs-pane__content"
        v-else-if="currentTabName === 'Headers'"
      >
        <response-headers-table :header-data="tabInfo.tempResponse.headers" />
      </div>
      <div
        class="response-tabs-pane__content"
        v-else-if="currentTabName === 'Test Results'"
      >
        <test-result />
      </div>
    </div>
  </div>
</template>
<script>
import {
  ref,
  watch,
  computed,
  toRefs,
  reactive,
  onMounted,
  nextTick,
  onBeforeUnmount,
  inject,
} from "vue";
import editor from "@/components/RequestEditor/ResponseTabs/responseEditor.vue";
import ResponseHeadersTable from "@/components/ResponseHeadersTable";
import TestResult from "@/components/RequestEditor/ResponseTabs/testResult.vue";
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
import { editItem } from "@/js/ipc/itemIPC.js";
import TypeEnum from "@/js/enum/typeEnum.js";
import { useStore } from "vuex";
import Helper from "@/js/utils/helper";

export default {
  components: {
    editor,
    ResponseHeadersTable,
    TestResult,
  },
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },

  setup(props) {
    const $bus = inject("$bus");
    const $message = inject("$message");
    const store = useStore();
    const { tabInfo } = toRefs(props);

    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const items = computed(() => {
      return store.getters.getCurrentWorkspaceItems;
    });

    const currentTabData = computed(() => {
      return store.getters.getCurrentTabData;
    });

    const bodyCode = ref("");

    const convertToBytes = (bodySize, headerSize) => {
      const kbTotal = bodySize + headerSize;
      const bytes = parseInt(kbTotal * 1024);

      return bytes || 0;
    };

    const currentTabName = ref("Body");
    const currentContentType = ref("");

    let base64Data = ref("");
    let imageUrl = ref("");
    let isMediaResponse = ref(false);

    watch(
      tabInfo.value,
      () => {
        // console.log(
        //   "watch tabInfo.value.tempResponse__",
        //   tabInfo.value.tempResponse
        // );
        const decoder = new TextDecoder("utf-8"); // 使用 UTF-8 編碼解析數據

        if (tabInfo.value.tempResponse && tabInfo.value.tempResponse.headers) {
          const responseHeader = tabInfo.value.tempResponse.headers;
          currentContentType.value = Helper.getContentType(responseHeader);
        }

        // 回傳為圖片
        if (
          currentContentType.value &&
          currentContentType.value.includes("image/")
        ) {
          if (tabInfo.value.tempResponse.data instanceof Uint8Array) {
            // 為 Uint8Array
            base64Data.value = window.btoa(
              new Uint8Array(tabInfo.value.tempResponse.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );
          } else if (typeof tabInfo.value.tempResponse.data === "string") {
            // 可能回傳一個 image url
            imageUrl.value = tabInfo.value.tempResponse.data;
          } else {
            // 非 Uint8Array
            const length = Object.keys(tabInfo.value.tempResponse.data).length;
            const uint8Array = new Uint8Array(length);

            for (let i = 0; i < length; i++) {
              uint8Array[i] = tabInfo.value.tempResponse.data[i];
            }

            base64Data.value = window.btoa(
              new Uint8Array(uint8Array).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );
          }
          isMediaResponse.value = true;
          return;
        }
        isMediaResponse.value = false;

        if (
          JSON.stringify(tabInfo.value.tempResponse) !== "{}" ||
          !tabInfo.value.tempResponse
        ) {
          if (typeof tabInfo.value.tempResponse?.data === "string") {
            bodyCode.value = tabInfo.value.tempResponse.data;
          } else {
            bodyCode.value = JSON.stringify(
              tabInfo.value.tempResponse?.data,
              null,
              4
            );
          }
        } else {
          bodyCode.value = "";
        }

        if (tabInfo.value.currentResTabName) {
          currentTabName.value = tabInfo.value.currentResTabName;
        } else {
          currentTabName.value = "Body";
        }
      },
      {
        immediate: true,
        // deep: true,
      }
    );

    const statusText = computed(() => {
      if (tabInfo.value.tempResponse) {
        if (tabInfo.value.tempResponse.status === 200) {
          return "OK";
        } else if (tabInfo.value.tempResponse.status === 404) {
          return "Not Found";
        } else if (tabInfo.value.tempResponse.status === 400) {
          return "Bad Request";
        } else if (tabInfo.value.tempResponse.errno) {
          return tabInfo.value.tempResponse.data.message;
        }
      }
      return "";
    });

    const formatSize = computed(() => {
      if (tabInfo.value?.tempResponse) {
        return convertToBytes(
          tabInfo.value.tempResponse.bodySize,
          tabInfo.value.tempResponse.headerSize
        );
      }
      return "";
    });

    const actionOptions = ref([
      {
        type: "save",
        label: "Save response to file",
      },
      {
        type: "clear",
        label: "Clear response",
      },
    ]);

    const getFileType = (contentType) => {
      const matches = contentType.match(/\/(.*)$/);
      if (!matches) return undefined;
      const type = decodeURI(matches[1]);
      return type;
    };

    const onSelect = Helper.throttle((actionType) => {
      let fileType = getFileType(currentContentType.value);
      let fileName =
        Helper.getFileName(tabInfo.value.tempResponse.headers) ||
        `${tabInfo.value.name}_response.${fileType}`;

      switch (actionType) {
        case "clear":
          tabInfo.value.tempResponse = null;
          break;
        case "save":
          let obj = {
            fileName,
            // fileStream: JSON.stringify(tabInfo.value.tempResponse.data),
            fileStream: tabInfo.value.tempResponse.arrayBufferData,
          };
          ipcRenderer.send("download-response-file", obj);
          break;
        default:
          break;
      }
    });

    const saveAsExample = async () => {
      if (isMediaResponse.value) return;
      const data = tabsData.setResponseExampleData(tabInfo.value);

      if (!tabInfo.value.response) {
        tabInfo.value.response = [];
      } else {
        tabInfo.value.response.push(data);
      }

      const res = await saveResponse(tabInfo.value);

      if (res.code === 20000) {
        const currentRequestData = tabsData.getCurrentItemData(
          items.value,
          tabInfo.value.id
        ); // 從sidebar找該response對應的request Data
        const currentResExample = currentRequestData.response.find(
          (e) => e.id === data.id
        ); // 確認sidebar否已新增該筆資料
        if (!currentResExample) {
          // 表示sidebar 尚未新增該資料
          const resExample = res.data.response.find((e) => e.id === data.id); // 從API回傳資料取得該resExample資料
          const resExampleIndex = res.data.response.findIndex(
            (e) => e.id === data.id
          ); // 從API回傳資料取得該resExample資料index，用於定義tabKey

          if (resExample) {
            resExample.requestId = tabInfo.value.id;
            resExample.tabType = TypeEnum.example.name;
            resExample.workspaceId = currentWorkspace.value.id;
            resExample.tabKey = `${currentRequestData.posKey}-${resExampleIndex}`;
            $bus.emit("handleTabAddAndFocused", resExample);
          }
        }
      } else {
        $message.warning(res.message);
      }
    };

    const saveResponse = async (data) => {
      const obj = {
        itemsId: data.id,
        response: JSON.parse(JSON.stringify(data.response)),
        // response: data.response,
        workspaceId: data.workspaceId,
      };

      return await editItem(obj);
    };

    const tabList = reactive([
      {
        tabName: "Body",
        key: "Body",
      },
      {
        tabName: "Headers",
        key: "Headers",
      },
      {
        tabName: "Test Results",
        key: "TestResults",
      },
    ]);

    const changeTab = (tab) => {
      currentTabName.value = tab.tabName;
      tabInfo.value.currentResTabName = tab.tabName; // NOTE: 這裡沒影響橘點，但上方的頁籤會
      store.commit("UPDATE_TAB", tabInfo.value);
    };

    const isChangeHeaderStyle = ref(false);

    const detectWindowSize = () => {
      if (window.innerWidth <= 1300) {
        isChangeHeaderStyle.value = true;
      } else {
        isChangeHeaderStyle.value = false;
      }
    };

    const panesHeight = computed(() => {
      if (isChangeHeaderStyle.value) {
        return "calc(100% - 88px)";
      }
      return "calc(100% - 48px)";
    });

    onMounted(() => {
      nextTick(() => {
        window.addEventListener("resize", detectWindowSize);
        detectWindowSize();
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", detectWindowSize);
    });

    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    const cancelRequest = () => {
      ipcRenderer.send("cancel-request", tabInfo.value.id);
    };

    return {
      base64Data,
      bodyCode,
      statusText,
      requestData,
      tabsData,
      formatSize,
      actionOptions,
      onSelect,
      tabList,
      currentTabName,
      changeTab,
      isChangeHeaderStyle,
      panesHeight,
      currentContentType,
      isMediaResponse,
      isVerticalMode,
      imageUrl,
      currentTabData,
      cancelRequest,
      saveAsExample,
    };
  },
};
</script>
<style lang="scss" scoped>
$response-header-height: 48px;

.state {
  display: flex;
  margin-left: 16px;
  margin-right: 16px;
  line-height: 45px;

  &__row {
    display: flex;
    align-content: center;
    margin-right: 15px;

    .ant-tabs-extra-content {
      span {
        font-size: 12px;
      }
    }
  }

  &__value {
    margin-left: 10px;
    color: #4eb948;
  }
}

.no-data {
  height: 100%;

  &__header {
    margin-top: 10px;
    color: #3c3c3c;
  }
  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

#response-tabs {
  height: 100%;
}

.response-error {
  height: 300px;

  &__header {
    color: #3c3c3c;
  }
  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
}

.error-image {
  width: 130px;
  height: 130px;
  margin-bottom: 10px;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.error-message {
  margin-bottom: 20px;
}

.error-text {
  padding: 3px 20px;
  border-radius: 20px;
  background-color: #ffdad9;
}

.response-action {
  position: relative;
  display: flex;
  align-items: center;

  &:deep(.ant-btn) {
    margin-right: 10px;
    padding: 10px 8px;
    height: unset;
    line-height: 0;

    span {
      font-size: 12px;
    }
  }

  &__option {
    width: 100%;
    display: block;
    user-select: none;

    &--disabled {
      cursor: not-allowed;
    }
  }

  &:deep(.ant-popover) {
    white-space: nowrap;
  }

  &--trigger-hover {
    &:hover {
      .response-action-tooltip {
        display: block;
      }
    }
  }

  &__list-icon {
    &:hover {
      cursor: pointer;
    }

    span {
      display: block;
      font-size: 20px;
    }
  }
}

.response-action-tooltip {
  position: absolute;
  z-index: 5;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  padding: 0 5px;
  min-width: 125px;
  width: 100%;
  line-height: 20px;
  font-size: 12px;
  letter-spacing: -0.5px;
  background-color: $primary-light-grey;
}

.body-container {
  position: relative;
  overflow: scroll;
  height: 100%;
  padding-bottom: 10px;

  &:deep(.ace_search) {
    top: 34px;
  }

  // 隱藏replace區塊
  &:deep(.replace_toggle) {
    display: none;
  }

  &:deep(.ace_replace_form) {
    display: none;
  }

  img {
    display: block;
    width: auto;
    height: auto;
  }

  &__block {
    width: 100%;
    height: 100%;
  }
}

.response-tabs-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex: 1 1 auto;
}

.response-tabs-pane {
  height: calc(100% - #{$response-header-height});

  &__content {
    height: 100%;
  }
}

.tabs-list {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 3px;
  transition: all 0.5s;
  overflow-x: scroll;

  &__item {
    min-width: 120px;
    padding: 6px 0;
    text-align: center;
    color: $primary-dark-grey;
    cursor: pointer;

    &--is-active {
      color: $primary-blue;
      box-shadow: inset 0 -2px 0 $primary-blue;
    }

    &:hover {
      color: $light-blue;
      // border-bottom: 1px solid $light-blue;
      box-shadow: inset 0 -2px 0 $light-blue;
    }
  }
}

.row-style {
  .response-tabs-header {
    display: block;
  }

  .state {
    margin: 0;
  }

  .response-action {
    margin-left: auto;
  }

  .response-action-btn {
    position: relative;
    margin-right: 0;
  }
}

.response-loading {
  position: absolute;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &__message {
    position: relative;
    z-index: 101;
    top: 40%;
    font-size: 14px;
    color: $primary-white;
    text-align: center;
  }

  &__cancel-button {
    position: relative;
    z-index: 101;
    top: 55%;
    left: 50%;
    transform: translateX(-50%);
    border-color: $primary-white;
    color: $primary-white;
    background-color: transparent;
  }
}
</style>

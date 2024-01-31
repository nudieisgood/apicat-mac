<template>
  <div class="request-editor">
    <!-- <test-url v-model="urlEditorValue" :rules="rules" /> -->
    <div id="header" class="header">
      <div class="url-input-block" v-if="tabInfo.request">
        <a-select :value="tabInfo.request.method" @change="changeRequestMethod">
          <a-select-option
            :value="method.label"
            v-for="method in methodTypeList"
            :key="method.id"
          >
            {{ method.label }}
          </a-select-option>
        </a-select>
        <div ref="editBlock" class="editable-block">
          <url-input-highlighter
            ref="highlighterInput"
            autocomplete="off"
            v-model="urlEditorValue"
            :rules="rules"
            spellcheck="false"
            @input="handleUrlInput"
            :key="inputKey"
            @blur="onBlur"
            :id="
              tabInfo.id === currentTabData.id
                ? `${currentTabData.id}-input-highlighter`
                : ''
            "
          />
          <variable-popover
            v-if="tabInfo.id === currentTabData.id"
            :variable-info="currentVarScope"
            :variable-id="currentVarId"
            :is-visible="isShowVariablePopover"
          >
          </variable-popover>
        </div>

        <div class="btns">
          <a-button class="btn-send" @click="sendRequest(tabInfo)"
            >SEND</a-button
          >
          <a-dropdown class="send-dropdown">
            <template #overlay>
              <a-menu>
                <a-menu-item key="1">Send and Download</a-menu-item>
              </a-menu>
            </template>
            <a-button>
              <down-outlined />
            </a-button>
          </a-dropdown>
        </div>
      </div>
    </div>
    <div
      class="content"
      :class="{
        'row-direction': !isVerticalMode,
      }"
      id="content"
      ref="contentRef"
    >
      <div
        class="content__request"
        id="content__request"
        :style="isVerticalMode ? requestHeight : requestWidth"
        :class="{ 'add-border': !isVerticalMode }"
      >
        <request-tabs v-if="!isHideRequestBlock" :tab-info="tabInfo" />
        <div class="horizontal-mode__right-arrow" v-if="isHideRequestBlock">
          <span @click="showRequestBlock" class="arrow-box__icon">
            <right-outlined />
          </span>
          <span class="arrow-box__label">Request Editor</span>
        </div>
      </div>
      <div
        class="content__response"
        id="content__response"
        ref="dragResponse"
        :style="
          isVerticalMode
            ? [
                { height: `${dragResponseData.realHeight}px` },
                { minHeight: `${dragResponseData.realHeight}px` },
              ]
            : { width: `${dragResponseData.realWidth}px` }
        "
      >
        <div
          class="arrow-box"
          :class="{ 'arrow-box-position': !isHideResponseBlock }"
        >
          <div class="vertical-mode-arrow" v-if="isVerticalMode">
            <span class="arrow-box__label" v-if="isHideResponseBlock"
              >Response</span
            >
            <span
              v-if="dragResponseData.realHeight <= 45"
              @click="showResponseBlock"
              class="arrow-box__icon"
            >
              <up-outlined />
            </span>
            <span v-else @click="hideResponseBlock" class="arrow-box__icon">
              <down-outlined />
            </span>
          </div>
        </div>
        <div
          class="horizontal-mode__left-arrow"
          v-if="isHideResponseBlock && !isVerticalMode"
        >
          <span
            v-if="dragResponseData.realWidth <= 45"
            @click="showResponseBlock"
            class="arrow-box__icon"
          >
            <left-outlined />
          </span>
          <span class="arrow-box__label">Response</span>
        </div>
        <div
          class="resize-bar resize-height-bar"
          @mousedown="mouseDownOnResponse($event)"
          v-if="isVerticalMode"
        >
          <div
            :class="{
              'resize-height-bar__body': dragResponseData.isShowResizeBar,
            }"
          ></div>
        </div>
        <div
          class="resize-width-bar"
          @mousedown="mouseDownOnResponse($event)"
          v-else
        >
          <div
            :class="{
              'resize-width-bar__body': dragResponseData.isShowResizeBar,
            }"
          ></div>
        </div>
        <!-- <response-tabs v-if="false" /> -->
        <!-- NOTE: 需重構 response data 格式-->
        <response-tabs v-if="!isHideResponseBlock" :tab-info="tabInfo" />
      </div>
    </div>
  </div>
</template>
<script>
import requestData from "@/store/requestData";
import RequestTabs from "@/components/RequestEditor/requestTabs";
import ResponseTabs from "@/components/RequestEditor/ResponseTabs";
import {
  computed,
  reactive,
  ref,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount,
  toRefs,
  watch,
  nextTick,
  inject,
} from "vue";
import tabsData from "@/store/tabs";
import workspaceData from "@/store/workspace";
import VariablePopover from "@/components/VariablePopover";
// import InputHighlighter from "@leyton-techlab/vue-input-highlighter";
import { infoLog } from "@/js/ipc/logIPC.js";
import { methodTypeList } from "@/js/enum/methodTypeEnum.js";
// import UrlInput from "@/components/UrlInput";
import store from "@/store";
import UrlInputHighlighter from "@/components/UrlInputHighlighter";

export default {
  name: "RequestEditor",
  components: {
    RequestTabs,
    ResponseTabs,
    VariablePopover,
    // InputHighlighter,
    // UrlInput,
    UrlInputHighlighter,
  },

  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  setup(props, context) {
    const $message = inject("$message");

    const currentTabData = computed(() => {
      return store.getters.getCurrentTabData;
    });

    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    const changeRequestMethod = (method) => {
      tabInfo.value.request.method = method;
    };

    // mock 用
    // const { proxy } = getCurrentInstance();
    // const getData = function () {
    //   proxy
    //     .$mockAxios({
    //       url: "/api/png",
    //       method: "get",
    //     })
    //     .then((res) => {
    //       console.log("mock server 請求成功__", res);
    //       // testData.list = res.data.dataList;
    //       store.commit("SET_CURRENT_TAB_RESPONSE_DATA", res.data);
    //     });
    // };

    const sendRequest = (currentTabInfo) => {
      // getData();
      // let a = true;
      // if (a) return;
      if (!currentTabInfo.request.url.raw) {
        $message.warning("Request URL is empty");
        return;
      }

      // console.log("currentTabInfo__", currentTabInfo);
      currentTabInfo.isSendingRequest = true;

      // requestData.sendRequest(currentTabInfo);
      requestData.beforeSendRequest(currentTabInfo);
      // requestData.handleAndSetRequestData(currentTabInfo);
    };

    // send request by "ctrl + Enter"
    const sendRequestByKeyDown = (e) => {
      if (e.keyCode === 13 && e.ctrlKey) {
        e.preventDefault();
        sendRequest(tabInfo.value);
      }
    };

    const isTyping = ref(false);

    const handleUrlInput = ($event) => {
      isTyping.value = true;

      tabsData.extractUrlParamsAndResetQuery(
        tabInfo.value,
        $event.target.innerText
      );

      tabInfo.value.request.url.raw = $event.target.innerText;
      // tabInfo.value.request.url.raw = urlEditorValue.value;
      initObserver();
    };



    /** 可自行伸縮 response 高度/寬度 */
    const dragResponse = ref();
    const dragResponseData = reactive({
      /** 伸縮高度 */
      currentHeight: null, // 當前 response 高度
      toTopHeight: null, // 距離頂部高度
      realHeight: null, // 伸縮後實際高度
      originalY: null, // 滑鼠點下的位置

      /** 伸縮寬度 */
      currentWidth: null, // 當前容器寬度
      targetDistant: null, // 容器距離右邊寬度
      realWidth: null, // 伸縮後實際寬度
      originalX: null, // 滑鼠點下的位置

      /** 共同使用的參數 */
      isDown: false, // 是否觸發滑鼠按著不放
      isShowResizeBar: false, // 是否顯示控制寬度 / 高度
    });

    const mouseDownOnResponse = (e) => {
      dragResponseData.isDown = true;
      if (isVerticalMode.value) {
        dragResponseData.currentHeight = dragResponse.value.offsetHeight;
        dragResponseData.toTopHeight = dragResponse.value.offsetTop;
        dragResponseData.originalY = e.clientY;
      } else {
        dragResponseData.currentWidth = dragResponse.value.offsetWidth;
        dragResponseData.originalX = e.clientX;
      }

      document.addEventListener("mousemove", mouseMoveOnResponse);
    };

    const mouseMoveOnResponse = (e) => {
      const contentHeight = contentRef.value.offsetHeight;
      if (dragResponseData.isDown) {
        if (isVerticalMode.value) {
          dragResponseData.realHeight =
            dragResponseData.currentHeight +
            (dragResponseData.originalY - e.clientY);
          if (dragResponseData.realHeight >= contentHeight * 0.8) {
            dragResponseData.realHeight = contentHeight - 40;
          } else if (dragResponseData.realHeight <= contentHeight * 0.3) {
            dragResponseData.realHeight = 45;
            isHideResponseBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
          }
          tabInfo.value.responseBoxHeight = dragResponseData.realHeight;
        } else {
          dragResponseData.realWidth =
            dragResponseData.currentWidth +
            (dragResponseData.originalX - e.clientX);
          const contentWidth = contentRef.value.offsetWidth;
          if (dragResponseData.realWidth < contentWidth * 0.3) {
            dragResponseData.realWidth = 45;
            isHideResponseBlock.value = true;
          } else if (dragResponseData.realWidth > contentWidth * 0.7) {
            dragResponseData.realWidth = contentWidth - 45;
            isHideRequestBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
            isHideRequestBlock.value = false;
          }
          tabInfo.value.responseBoxWidth = dragResponseData.realWidth;
        }
      }
    };

    const requestHeight = computed(
      () => `height: calc(100% - ${dragResponseData.realHeight}px)`
    );
    const requestWidth = computed(() => {
      if (!dragResponseData.realWidth) {
        return `width: 50%`;
      }
      return `width: calc(100% - ${dragResponseData.realWidth}px)`;
    });

    const mouseUpOnResponse = (e) => {
      dragResponseData.isShowResizeBar = false;
      dragResponseData.isDown = false;
      document.removeEventListener("mousemove", mouseMoveOnResponse);
    };

    const showResponseBlock = () => {
      const contentWidth = contentRef.value.offsetWidth;
      if (isVerticalMode.value) {
        dragResponseData.realHeight = 300;
      } else {
        dragResponseData.realWidth = contentWidth * 0.6;
      }
      isHideResponseBlock.value = false;
    };

    const showRequestBlock = () => {
      const contentWidth = contentRef.value.offsetWidth;
      isHideRequestBlock.value = false;
      dragResponseData.realWidth = contentWidth * 0.4;
    };

    const hideResponseBlock = () => {
      dragResponseData.realHeight = 45;
      isHideResponseBlock.value = true;
    };

    const isHideResponseBlock = ref(false);
    const isHideRequestBlock = ref(false);

    watch(
      () => isVerticalMode,
      () => {
        if (!isVerticalMode.value) {
          dragResponseData.realWidth =
            document.getElementById("content").offsetWidth * 0.5;
          if (dragResponseData.realWidth <= 45) {
            isHideResponseBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
          }
        } else {
          if (dragResponseData.realHeight <= 45) {
            isHideResponseBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
            isHideRequestBlock.value = false;
          }
        }
      }
    );

    onMounted(() => {
      document.addEventListener("mouseup", mouseUpOnResponse);
      window.addEventListener("keydown", sendRequestByKeyDown);

      nextTick(() => {
        if (isVerticalMode.value) {
          if (!dragResponse.value.offsetHeight) {
            dragResponseData.realHeight = 358;
          } else {
            dragResponseData.realHeight = dragResponse.value.offsetHeight;
          }

          tabInfo.value.responseBoxHeight = dragResponseData.realHeight;
        } else {
          if (!contentRef.value.offsetWidth) {
            dragResponseData.realWidth = "50%";
          } else {
            dragResponseData.realWidth = contentRef.value.offsetWidth * 0.6;
          }
          tabInfo.value.responseBoxWidth = dragResponseData.realWidth;
        }
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", sendRequestByKeyDown);
    });

    const { tabInfo } = toRefs(props);

    const contentRef = ref();

    const rules = [
      { regex: /(\{\{.+?\}\})/gim, tag: "span", class: "highlight" },
    ];

    // url有變化時，綁定variable 的onmouseenter、onmouseleave事件，用於控制顯示變數內容彈窗
    const initObserver = () => {
      const editBlockEl = document.getElementById(
        `${currentTabData.value.id}-input-highlighter`
      );
      const config = {
        childList: true, // 偵測子節點的更改
        subtree: true, // 偵測子節點的子節點
      };
      const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // 檢測到 DOM 元素增加
            // console.log("DOM 元素已增加:", mutation.addedNodes);
            mutation.addedNodes.forEach((node, index) => {
              if (node.nodeName === "SPAN") {
                node.onmouseenter = tagMouseenter;
                node.onmouseleave = tagMouseleave;
                node.id = `${currentTabData.value.id}-${node.className}-${index}`;
              }
            });
          }
        }
      });

      observer.observe(editBlockEl, config);
      // observer.observe(editBlock.value, config);
    };

    const isShowVariablePopover = ref(false);

    const currentVarScope = ref({});
    const currentVarId = ref("");

    const tagMouseenter = (e) => {
      const popoverEl = document.getElementById(
        `${currentTabData.value.id}-popover-wrapper`
      );

      // const targetClientRect = e.target.getBoundingClientRect();
      // currentVarScope.value = {};
      const text = e.target.innerText;
      const result = workspaceData.searchVariableInRequestUrl(text);

      // result.value 有可能為為 {{xx}}，須轉換實際值
      const currentValue = tabsData.searchAndUseVariables(result.value);

      if (result) {
        currentVarScope.value = {
          text,
          currentValue,
          ...result,
        };
      } else {
        currentVarScope.value = {};
      }

      if (popoverEl) {
        nextTick(() => {
          popoverEl.style.left = e.target.offsetLeft + "px";
          popoverEl.style.display = "block";
          isShowVariablePopover.value = true;
        });
      }
    };

    const tagMouseleave = (e) => {
      const popoverEl = document.getElementById(
        `${currentTabData.value.id}-popover-wrapper`
      );
      if (e.relatedTarget.className === "variable-popover-wrapper") return;
      currentVarScope.value = {};
      currentVarId.value = "";

      popoverEl.style.display = "none";
      isShowVariablePopover.value = false;
    };

    // 一開始畫面渲染時，綁定variable 的onmouseenter、onmouseleave事件，用於控制顯示變數內容彈窗
    const defaultInit = () => {
      const editBlockEl = document.getElementById(
        `${currentTabData.value.id}-input-highlighter`
      );

      if (!editBlockEl) return;
      const childrenList = editBlockEl.querySelectorAll(".highlight");
      // const childrenList = [].concat(editBlockEl.children);
      if (childrenList && childrenList.length > 0) {
        let index = 0;
        for (const node of childrenList) {
          if (node.nodeName === "SPAN") {
            node.onmouseenter = tagMouseenter;
            node.onmouseleave = tagMouseleave;
            node.id = `${currentTabData.value.id}-${node.className}-${index}`;
            index += 1;
          }
        }
      }
    };
    const editBlock = ref();

    const highlighterInput = ref();
    const inputKey = ref(0);

    watch(
      () => tabInfo.value.request.url.raw,
      (newVal, oldVal) => {
        // highlighterInput.value.$el.textContent = tabInfo.value.request.url.raw;
        if (!isTyping.value) {
          urlEditorValue.value = tabInfo.value.request.url.raw;
          inputKey.value += 1; // 從 Query Params更新request url的值時，不會觸發變數 highlight 效果，藉由key來強制更新

          // 重新設定變數popover
          nextTick(() => {
            defaultInit();
          });
        }
      },
      {
        deep: true,
      }
    );

    watch(
      () => currentTabData.value,
      (newVal, oldVal) => {
        // 切換tab時，須重新觸發設定 tag mouseenter、mouseleave事件
        if (newVal && newVal !== oldVal) {
          if (newVal.id === tabInfo.value.id) {
            nextTick(() => {
              if (!tabInfo.value.request.url.raw) {
                initObserver();
              } else {
                defaultInit();
              }
            });
          }
        }
      },
      {
        immediate: true,
      }
    );

    const onBlur = () => {
      console.log('Blur-----',highlighterInput.value.modelValue)
      isTyping.value = false;
      // 觸發blur時，將當前輸入框的值更新到 tabInfo.value.request.url.raw
      tabInfo.value.request.url.raw = highlighterInput.value.modelValue;
      // tabInfo.value.request.url.raw = highlighterInput.value.$el.textContent;
    };

    const urlEditorValue = ref("");

    watch(
      tabInfo,
      () => {
        urlEditorValue.value = tabInfo.value.request.url.raw;
      },
      {
        immediate: true,
      }
    );

    // 監聽 request method 的變化，設置對應的 content-type 與 content-length
    watch(
      () => tabInfo.value.request.method,
      () => {
        tabsData.setContentTypeAndLength(tabInfo.value);
      },
      {
        // immediate: true,
      }
    );

    // 監聽 request bode mode 的變化，設置對應的 content-type 與 content-length
    watch(
      () => tabInfo.value.request.body.mode,
      () => {
        tabsData.setContentTypeAndLength(tabInfo.value);
      },
      {
        // immediate: true,
      }
    );

    /**
     * 2023/11/22：原本要改使用 monaco editor 來呈現 highligh 效果，但 editor.setValue部分會讓畫面閃爍，目前想不到解決方式
     * 以下為相關函式，先註解
     *
     */
    // const isUpdateQuery = ref(false);

    // const updateModelValue = (url) => {
    //   urlEditorValue.value = url; // NOTE：這邊會影響 url-input 組件的雙向綁定，先暫時用 isUpdateQuery 來區別是否由編輯表格更新 url
    //   isUpdateQuery.value = true;
    // };

    // const updateStatus = () => {
    //   if (isUpdateQuery.value) {
    //     isUpdateQuery.value = false; // 表示於 url-input 做編輯
    //   }
    // };

    // watch(urlEditorValue, () => {
    //   tabInfo.value.request.url.raw = urlEditorValue.value;
    //   if (isUpdateQuery.value) return;
    //   tabsData.extractUrlParamsAndResetQuery(
    //     tabInfo.value,
    //     urlEditorValue.value
    //   );
    //   initObserver();
    // });

    return {
      requestData,
      changeRequestMethod,
      sendRequest,
      tabsData,
      handleUrlInput,
      dragResponse,
      dragResponseData,
      mouseDownOnResponse,
      requestHeight,
      requestWidth,
      mouseUpOnResponse,
      showResponseBlock,
      hideResponseBlock,
      showRequestBlock,
      isHideResponseBlock,
      isHideRequestBlock,
      contentRef,
      rules,
      editBlock,
      isShowVariablePopover,
      currentVarScope,
      currentVarId,
      highlighterInput,
      onBlur,
      inputKey,
      methodTypeList,
      urlEditorValue,
      isVerticalMode,
      currentTabData,
    };
  },
};
</script>
<style lang="scss" scoped>
$requester-tabs-header: 42px; // url-input-block的高度:32 + margin:21
$method-select-width: 110px;
$button-send-width: 101px;

.content {
  height: calc(100% - $requester-tabs-header);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;

  &__request {
    position: relative;
    height: 48%;
  }

  &__response {
    position: relative;
    height: 48%;
    border: 1px solid #f0f0f0;
    padding: 0 10px;
    background-color: $primary-white;
    z-index: 5;
    min-height: 358px;
  }
}
.header {
  width: 100%;

  &__name-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    p {
      margin-bottom: 0;
      font-weight: 600;
    }
  }

  .url-input-block {
    // margin-top: 11px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    height: 32px;

    .ant-input-group.ant-input-group-compact {
      display: flex;
      height: 100%;
    }

    .ant-select {
      width: 110px;
      height: 100%;

      &:deep(.ant-select-selector) {
        border-radius: 4px 0 0 4px;
        border-color: $secondary-light-grey;
      }

      .ant-select-selection-item {
        color: #333;
        line-height: 40px;
      }

      .ant-select-arrow {
        color: #949494;
      }
    }

    .ant-input {
      flex: 1;
      height: 100%;
      background-color: #fafafa;
      border: 1px solid #d0d0d0;

      &::placeholder {
        color: #949494;
      }

      &:focus {
        background-color: $primary-white;

        &:hover {
          background-color: unset;
        }
      }

      &:hover {
        background-color: #eaeaea;
      }
    }

    .btns {
      height: 100%;
      display: flex;
      align-items: center;

      .ant-btn {
        height: 100%;
        background-color: $dark-blue;
        border-color: $dark-blue;
        color: $primary-white;
        border-radius: 0;

        &:hover {
          color: $primary-white;
          border-color: $dark-blue;
        }
      }

      .send-dropdown {
        height: 100%;
        padding: 4px 10px;
        border-left: 1.5px solid rgb(42, 89, 120);
        border-radius: 0 3px 3px 0;

        &:deep(.anticon) {
          color: $primary-white;
        }
      }
    }

    .editable-block {
      position: relative;
      outline: none;
      width: calc(100% - #{$method-select-width} - #{$button-send-width});
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 8px;
      border: 1px solid $secondary-light-grey;
      border-left: unset;
      font-size: $text-size-m;
      // overflow: hidden;
      white-space: nowrap;

      .input-highlighter {
        overflow: hidden;
        outline: none;
      }
    }
  }
}

.request-editor {
  height: 100%;
  // height: calc(100% - #{$requester-tabs-header});
}

.resize-height-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1.5px;
  z-index: 8;
  cursor: n-resize;

  .resize-height-bar__body {
    width: 100%;
    height: 100%;
    background-color: $primary-blue;
  }

  &:hover {
    background-color: $primary-blue;
  }
}

.resize-width-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 1.5px;
  height: 100%;
  z-index: 8;
  cursor: w-resize;

  .resize-width-bar__body {
    width: 100%;
    height: 100%;
    background-color: $primary-blue;
  }

  &:hover {
    background-color: $primary-blue;
  }
}

.arrow-box {
  z-index: 8;

  &__icon {
    cursor: pointer;
  }

  &__label {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #888787;
    writing-mode: tb;
    transform: rotate(180deg);
  }
}

.arrow-box-position {
  position: absolute;
  right: 15px;
}

.horizontal-mode {
  &__right-arrow,
  &__left-arrow {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
  }
}

.vertical-mode-arrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;

  .arrow-box__label {
    writing-mode: unset;
    transform: unset;
  }
}

/** 左右排版 */
.row-direction {
  flex-direction: row;

  .content__request {
    width: 50%;
    height: 100%;
  }

  .content__response {
    width: 50%;
    height: 100%;
  }
}

.add-border {
  padding-left: 5px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  border-left: 1px solid #f0f0f0;
}

:deep(.variable) {
  position: relative;
  color: orange;
  // color: #ffffff;
  // background-color: #475662;
  // padding: 0 4px;
  // display: inline-block;
  // margin: 0 2px;
  // border-radius: 4px;
  // letter-spacing: 0.3px;
}

:deep(.variable-box) {
  position: absolute;
  width: 100px;
  height: 100px;
  background-color: #333;
}

// .variable-popover-wrapper {
//   display: none;
// }

// .variable-popover-wrapper:hover,
// .input-highlighter:hover + .variable-popover-wrapper {
//   display: block;
// }
</style>

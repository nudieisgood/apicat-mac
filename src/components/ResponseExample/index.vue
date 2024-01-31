<template>
  <div class="request-editor">
    <div id="header" class="header">
      <div class="url-input-block" v-if="tabInfo.originalRequest">
        <a-select
          :value="tabInfo.originalRequest.method"
          @change="changeRequestMethod"
        >
          <a-select-option
            :value="method.label"
            v-for="method in methodTypeList"
            :key="method.id"
          >
            {{ method.label }}
          </a-select-option>
        </a-select>
        <div ref="editBlock" class="editable-block">
          <!-- <input-highlighter
            ref="highlighterInput"
            autocomplete="off"
            :modelValue="urlEditorValue"
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
          /> -->
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
      </div>
    </div>
    <div
      class="content"
      :class="{
        'row-direction': !isVerticalMode,
      }"
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
            ? { height: `${dragResponseData.realHeight}px` }
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
        <response-tabs v-if="!isHideResponseBlock" :tab-info="tabInfo" />
      </div>
    </div>
  </div>
</template>
<script>
import RequestTabs from "@/components/ResponseExample/requestTabs.vue";
import ResponseTabs from "@/components/ResponseExample/responseTabs.vue";
import {
  computed,
  reactive,
  ref,
  inject,
  onMounted,
  onBeforeUnmount,
  toRefs,
  watch,
  nextTick,
} from "vue";
import tabsData from "@/store/tabs";
import workspaceData from "@/store/workspace";
import VariablePopover from "@/components/VariablePopover";
// import InputHighlighter from "@leyton-techlab/vue-input-highlighter";
import { methodTypeList } from "@/js/enum/methodTypeEnum.js";
import store from "@/store";
import UrlInputHighlighter from "@/components/UrlInputHighlighter";

// import UrlInput from "@/components/UrlInput";

export default {
  name: "RequestExample",
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
  // emits: {
  //   "update-example-request": null,
  // },
  setup(props, context) {
    const $bus = inject("$bus");

    const { tabInfo } = toRefs(props);

    const currentTabData = computed(() => {
      return store.getters.getCurrentTabData;
    });

    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    const changeRequestMethod = (method) => {
      tabInfo.value.originalRequest.method = method;
    };

    const editBlock = ref();

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
    };

    const currentVarScope = ref({});
    const currentVarId = ref("");
    const isShowVariablePopover = ref(false);

    const rules = [
      { regex: /(\{\{.+?\}\})/gim, tag: "span", class: "highlight" },
    ];

    const tagMouseenter = (e) => {
      const popoverEl = document.getElementById(
        `${currentTabData.value.id}-popover-wrapper`
      );
      const targetClientRect = e.target.getBoundingClientRect();
      // currentVarScope.value = {};
      const text = e.target.innerText;
      const result = workspaceData.searchVariableInRequestUrl(text);

      if (result) {
        currentVarScope.value = {
          text,
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

    const highlighterInput = ref();
    const inputKey = ref(0);

    watch(
      () => currentTabData.value,
      (newVal, oldVal) => {
        // 切換tab時，須重新觸發設定 tag mouseenter、mouseleave事件
        if (newVal && newVal !== oldVal) {
          if (newVal.id === tabInfo.value.id) {
            nextTick(() => {
              if (!tabInfo.value.originalRequest.url.raw) {
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
      isTyping.value = false;
      // 觸發blur時，將當前輸入框的值更新到 tabInfo.originalRequest.url.raw
      tabInfo.value.originalRequest.url.raw = highlighterInput.value.modelValue;
      // tabInfo.value.originalRequest.url.raw =
      //   highlighterInput.value.$el.textContent;
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
      realWidth: 700, // 伸縮後實際寬度
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
      if (dragResponseData.isDown) {
        if (isVerticalMode.value) {
          dragResponseData.realHeight =
            dragResponseData.currentHeight +
            (dragResponseData.originalY - e.clientY);
          if (dragResponseData.realHeight >= 710) {
            dragResponseData.realHeight = 730;
          } else if (dragResponseData.realHeight <= 120) {
            dragResponseData.realHeight = 45;
            isHideResponseBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
          }
        } else {
          dragResponseData.realWidth =
            dragResponseData.currentWidth +
            (dragResponseData.originalX - e.clientX);
          if (dragResponseData.realWidth < 300) {
            dragResponseData.realWidth = 45;
            isHideResponseBlock.value = true;
          } else if (dragResponseData.realWidth > 1200) {
            dragResponseData.realWidth = 1455;
            isHideRequestBlock.value = true;
          } else {
            isHideResponseBlock.value = false;
            isHideRequestBlock.value = false;
          }
        }
      }
    };

    const requestHeight = computed(
      () => `height: calc(100% - ${dragResponseData.realHeight}px)`
    );
    const requestWidth = computed(
      () => `width: calc(100% - ${dragResponseData.realWidth}px)`
    );

    const mouseUpOnResponse = (e) => {
      dragResponseData.isShowResizeBar = false;
      dragResponseData.isDown = false;
      document.removeEventListener("mousemove", mouseMoveOnResponse);
    };

    const showResponseBlock = () => {
      if (isVerticalMode.value) {
        dragResponseData.realHeight = 300;
      } else {
        dragResponseData.realWidth = 500;
      }
      isHideResponseBlock.value = false;
    };

    const showRequestBlock = () => {
      isHideRequestBlock.value = false;
      dragResponseData.realWidth = 900;
    };

    const hideResponseBlock = () => {
      dragResponseData.realHeight = 45;
      isHideResponseBlock.value = true;
    };

    const isHideResponseBlock = ref(false);
    const isHideRequestBlock = ref(false);

    onMounted(() => {
      document.addEventListener("mouseup", mouseUpOnResponse);
      nextTick(() => {
        if (isVerticalMode.value) {
          if (!dragResponse.value.offsetHeight) {
            dragResponseData.realHeight = 358;
          } else {
            dragResponseData.realHeight = dragResponse.value.offsetHeight;
          }
          tabInfo.value.responseBoxHeight = dragResponseData.realHeight;
        }
      });
    });

    onBeforeUnmount(() => {
      $bus.off("changeModeStatus");
    });

    const urlEditorValue = ref("");

    const isTyping = ref(false);

    const handleUrlInput = ($event) => {
      isTyping.value = true;
      tabsData.extractUrlParamsAndResetQuery(
        tabInfo.value,
        $event.target.innerText
      );

      tabInfo.value.originalRequest.url.raw = $event.target.innerText;
      initObserver();
    };

    watch(
      () => tabInfo.value.originalRequest.url.raw,
      (newVal, oldVal) => {
        // highlighterInput.value.$el.textContent =
        //   tabInfo.value.originalRequest.url.raw;
        if (!isTyping.value) {
          urlEditorValue.value = tabInfo.value.originalRequest.url.raw;
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
      tabInfo,
      () => {
        urlEditorValue.value = tabInfo.value.originalRequest.url.raw;
      },
      {
        immediate: true,
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
    //     isUpdateQuery.value = false;
    //   }
    // };

    // watch(urlEditorValue, () => {
    //   if (isUpdateQuery.value) return;
    //   tabInfo.value.originalRequest.url.raw = urlEditorValue.value;
    //   tabsData.extractUrlParamsAndResetQuery(
    //     tabInfo.value,
    //     urlEditorValue.value
    //   );
    //   initObserver();
    // });

    return {
      changeRequestMethod,
      tabsData,
      editBlock,
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
      inputKey,
      onBlur,
      highlighterInput,
      isShowVariablePopover,
      currentVarScope,
      currentVarId,
      rules,
      methodTypeList,
      urlEditorValue,
      isVerticalMode,
      currentTabData,
    };
  },
};
</script>
<style lang="scss" scoped>
$requester-tabs-header: 42px; // url-input-block的高度 + margin-bottom
$method-select-width: 110px;

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
  }
}
.header {
  width: 100%;

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

    .editable-block {
      position: relative;
      outline: none;
      width: calc(100% - #{$method-select-width});
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
</style>

<template>
  <div class="script-wrapper">
    <div class="json-editor">
      <!-- <div ref="codeEditor" class="editor">
        <code>{{ modelValue }}</code>
      </div> -->
      <div ref="codeEditor" class="editor" />
    </div>
  </div>
</template>

<script>
import * as monaco from "monaco-editor";
import {
  onBeforeUnmount,
  onMounted,
  ref,
  toRefs,
  watch,
  nextTick,
  inject,
} from "vue";
import tabsData from "@/store/tabs";
import requestData from "@/store/requestData";
import ActivityTypeEnum from "@/js/enum/activityTypeEnum";
import TypeEnum, { classifyType } from "@/js/enum/typeEnum.js";
import Helper from "@/js/utils/helper";

export default {
  name: "TestsEditor",
  components: {},
  props: {
    readOnly: {
      type: Boolean,
      default: false,
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
    currentTabName: {
      type: String,
      default: "",
    },
    modelValue: {
      type: String,
      default: "",
    },
    mouseEnter: {
      type: Function,
      default: () => {},
    },
    mouseLeave: {
      type: Function,
      default: () => {},
    },
  },
  emits: {
    "update:modelValue": null,
    "update-model-value": null,
    "update-status": null,
  },

  setup(props, context) {
    const $bus = inject("$bus");
    const $message = inject("$message");

    const {
      readOnly,
      tabInfo,
      currentTabName,
      modelValue,
      mouseEnter,
      mouseLeave,
    } = toRefs(props);

    const codeEditor = ref();
    let editor;

    watch(readOnly, () => {
      if (editor.value != null) {
        editor.value.setOption("readOnly", readOnly.value);
      }
    });

    let completionProvider;

    const init = () => {
      monaco.editor.defineTheme("myTheme", {
        base: "vs",
        inherit: true,
        rules: [
          {
            // token: 'comment',
            // foreground: 'ffa500',
            // fontStyle: 'italic underline'
          },
          // { token: 'comment.js', foreground: '008800', fontStyle: 'bold' },
          // { token: 'comment.css', foreground: '0000ff' } // will inherit fontStyle from `comment` above
        ],
        colors: {
          "editor.background": "#ffffff", // code background
          "editorLineNumber.activeForeground": "#085783",
          "editorLineNumber.foreground": "#085783",
          "editor.lineHighlightBorder": "#00000000",
        },
      });

      // 初始化编辑器
      editor = monaco.editor.create(codeEditor.value, {
        language: "text",
        tabSize: 4,
        scrollBeyondLastLine: false,
        automaticLayout: true, // 自動布局
        readOnly: false,
        folding: false, // 摺疊
        minimap: {
          // 縮略圖
          enabled: false,
        },
        lineDecorationsWidth: 0,
        theme: "myTheme",
        lineNumbers: "off",
        overviewRulerLanes: 0,
        quickSuggestions: false, // 禁用快速建議
        suggest: { filteredTypes: { keyword: false } },
        autoClosingBrackets: false,
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        saveTabByHotkey
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        sendRequestByHotkey
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
        closeFindAction
      );

      /**
       * 監聽失去焦點事件
       * 1. 設定編輯器最新內容
       * 2. 移除 registerCompletionItemProvider
       */
      editor.onDidBlurEditorText((e) => {
        if (completionProvider) {
          completionProvider.dispose();
        }
      });

      if (modelValue.value) {
        if (!editor) return;

        editor.setValue(modelValue.value);
        setHighlight();
      }

      // 預設初始值後，接著綁定 onDidChangeModelContent 監聽編輯器內容變化；若於預設初始值前綁定，會被視為有內容變化而影響判斷 tab 的編輯狀態
      editor.onDidChangeModelContent((event) => {
        const value = editor.getValue();
        context.emit("update:modelValue", value);
        context.emit("update-status");

        setTimeout(() => {
          setHighlight();
        }, 0);
      });
    };

    // 禁用搜尋功能
    const closeFindAction = () => {
      return false;
    };

    const setHighlight = async () => {
      const regex = /(\{\{.+?\}\})/gm;
      const matches = modelValue.value.match(regex) || [];
      let newMatches = matches.map((e, index) => {
        return {
          id: index,
          value: e,
          isAlreadyHighlighted: false,
        };
      });

      const existingHighlights = document.getElementsByClassName("highlight");

      Array.from(existingHighlights).forEach((el, index) => {
        newMatches[index].isAlreadyHighlighted = true;
      });

      const decorations = newMatches
        .map((match) => {
          const foundMatches = editor.getModel().findMatches(match.value);
          if (!match.isAlreadyHighlighted) {
            if (foundMatches && foundMatches.length > 0) {
              return {
                range: foundMatches[0].range,
                options: {
                  // isWholeLine: false,
                  inlineClassName: "highlight", // Your custom CSS class
                  stickiness: 1,
                },
              };
            }
          }
          return null;
        })
        .filter((decoration) => decoration !== null);

      editor.deltaDecorations([], decorations);

      setTimeout(() => {
        const highlightList = document.getElementsByClassName("highlight");
        for (let i = 0; i < Array.from(highlightList).length; i++) {
          // for (let i = 0; i < highlightList.length; i++) {
          highlightList[i].onmouseenter = mouseEnter.value;
          highlightList[i].onmouseleave = mouseLeave.value;
          highlightList[
            i
          ].id = `${tabsData.tabInfo.currentTabId}-${highlightList[i].className}-${i}`;
        }
      }, 500);
    };

    // 快捷鍵 ctrl+enter：送出請求
    const sendRequestByHotkey = () => {
      onBlur();

      if (tabInfo.value.tabType === ActivityTypeEnum.ITEM.name) {
        if (!tabInfo.value.request.url.raw) {
          $message.warning("Request URL is empty");
          return;
        }
        requestData.beforeSendRequest(tabInfo.value);
      }
    };

    // 快捷鍵 ctrl+s：儲存tab編輯後內容
    const saveTabByHotkey = () => {
      onBlur();
      $bus.emit("onSave", tabInfo.value);
    };

    // 透過blur觸發更新編輯器內容
    const onBlur = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    onMounted(() => {
      nextTick(() => {
        init();
      });
    });

    onBeforeUnmount(() => {
      if (completionProvider) {
        completionProvider.dispose();
      }

      if (editor !== null) {
        editor.dispose();
        editor = null;
      }
    });

    watch(
      modelValue,
      (newVal, oldVal) => {
        nextTick(() => {
          if (!editor) {
            return;
          }
          if (!modelValue.value) {
            editor.setValue("");
            return;
          }

          // 於編輯器輸入內容時，因觸發 editor.setValue 會讓光標位置跑到最前面，所以需要紀錄 setValue 前的位置，並於 setValue 後恢復;
          if (oldVal !== newVal) {
            // if (oldVal !== editor.getValue()) {
            // 儲存當前光標位置
            // Helper.debounce((event) => {
            const prevSelection = editor.getSelection();
            editor.setValue(newVal); // 閃爍主因

            // 恢復光標位置
            editor.setSelection(prevSelection);
            // }, 0);
          }
        });
      },
      {
        immediate: true,
      }
    );

    watch(
      () => tabInfo.value,
      (newVal, oldVal) => {
        if (tabInfo.value.tabType === TypeEnum.item.name) {
          context.emit("update-model-value", newVal.request.url.raw);
        } else {
          context.emit("update-model-value", newVal.originalRequest.url.raw);
        }
      },
      {
        deep: true,
      }
    );

    return {
      codeEditor,
      onBlur,
    };
  },
};
</script>

<style scoped lang="scss">
.script-wrapper {
  height: 20px;
}

.json-editor {
  width: 100%;
  height: 100%;
  padding: 0 8px;
}

.editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:deep(.monaco-scrollable-element > .invisible) {
  display: none !important;
}
</style>

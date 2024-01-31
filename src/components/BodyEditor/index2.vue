<template>
  <div class="body-editor">
    <div class="item-search" @click="search"><search-outlined /></div>
    <div class="json-editor">
      <div ref="codeEditor" class="editor"></div>
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
import requestData from "@/store/requestData";
import TypeEnum from "@/js/enum/typeEnum.js";

export default {
  name: "BodyEditor",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    defaultValue: {
      type: String,
      default: "",
    },
    modeValue: {
      type: String,
      default: "",
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },

  emits: {
    change: null,
    "update:modelValue": null,
    blur: null,
    focus: null,
  },

  setup(props, context) {
    const $bus = inject("$bus");
    const $message = inject("$message");
    const { modelValue, tabInfo } = toRefs(props);
    const codeEditor = ref();

    let editor;
    let initVal;

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
        language: "json",
        tabSize: 4,
        scrollBeyondLastLine: false,
        automaticLayout: true, // 自動布局
        readOnly: false,
        folding: true, // 摺疊
        minimap: {
          // 縮略圖
          enabled: false,
        },
        lineDecorationsWidth: 55,
        theme: "myTheme",
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        saveTabByHotkey
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        sendRequestByHotkey
      );

      // 監聽編輯器失去焦點事件，並更新編輯器最新內容
      editor.onDidBlurEditorText((e) => {
        // context.emit("update-raw", editor.getValue());
      });

      // 於editor focus 時新增editor.onDidChangeModelContent 事件，避免一開始的預設值影響tab的編輯狀態
      editor.onDidFocusEditorText((e) => {
        // 監聽編輯器內容變化
        // editor.onDidChangeModelContent((event) => {
        //   if (editor.getValue() !== initVal) {
        //     // tabInfo.value.isEditing = true // 此為tab的編輯狀態
        //   }
        //   // 透過 Ctrl+F開啟搜尋彈窗時，會使編輯器失去焦點，假如使用replace功能時，會沒更新到編輯器內容，因此需另外做更新動作
        //   if (!editor.hasTextFocus()) {
        //     context.emit("update-raw", editor.getValue());
        //   }
        // });
      });

      // editor.onDidChangeModelContent((event) => {
      //   console.log("onDidChangeModelContent__", event);
      //   const value = editor.getValue();
      //   console.log("value__", value);
      //   context.emit("update:modelValue", value);
      // });

      // 預設編輯器初始內容
      if (modelValue.value) {
        if (!editor) return;
        initVal = modelValue.value;
        editor.setValue(modelValue.value);

        // 預設初始值後，接著綁定 onDidChangeModelContent 監聽編輯器內容變化；若於預設初始值前綁定，會被視為有內容變化而影響判斷 tab 的編輯狀態
      }
      editor.onDidChangeModelContent((event) => {
        const value = editor.getValue();
        context.emit("update:modelValue", value);
      });
    };

    // 快捷鍵 ctrl+enter：送出請求
    const sendRequestByHotkey = () => {
      onBlur();
      // NOTE：目前example頁面未有送出請求功能，因此先 return
      if (tabInfo.value.tabType === TypeEnum.example.name) return;

      if (!tabInfo.value.request.url.raw) {
        $message.warning("Request URL is empty");
        return;
      }
      requestData.beforeSendRequest(tabInfo.value);
    };

    // 快捷鍵 ctrl+s：儲存tab編輯後內容
    const saveTabByHotkey = () => {
      onBlur();
      $bus.emit("onSave", tabInfo.value);
    };

    // 觸發blur更新編輯器的值
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
      // completionProvider.dispose()
      if (editor !== null) {
        editor.dispose();
        editor = null;
      }
    });

    const search = () => {
      editor.trigger("", "actions.find");
    };

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
          if (oldVal !== editor.getValue()) {
            // 儲存當前光標位置
            const prevSelection = editor.getSelection();
            editor.setValue(newVal);
            // 恢復光標位置
            editor.setSelection(prevSelection);
          }
        });
      },
      {
        immediate: true,
      }
    );

    return {
      codeEditor,
      search,
    };
  },
};
</script>

<style scoped lang="scss">
.body-editor {
  position: relative;
  height: 100%;
}

.json-editor {
  height: 100%;
  // flex-basis: 80%;
}

.editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid $secondary-light-grey;
  border-radius: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;

  &__item {
    margin-left: 10px;
    cursor: pointer;

    &:deep(.anticon) {
      font-size: 16px;
    }
  }
}

.item-search {
  position: absolute;
  top: 10px;
  right: 20px;
  margin-bottom: 12px;
  z-index: 5;

  &:deep(.anticon) {
    font-size: 16px;
  }
}
</style>

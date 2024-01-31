<template>
  <div class="response-editor">
    <div class="actions" ref="actionsRef">
      <div class="actions__item actions__item-copy" @click="copy">
        <copy-filled />
      </div>
      <div class="actions__item actions__item-search" @click="search">
        <search-outlined />
      </div>
    </div>
    <div class="editor-wrapper" ref="editorWrapperRef">
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
import TypeEnum from "@/js/enum/typeEnum.js";
import requestData from "@/store/requestData";

const beautify = require("js-beautify").html_beautify;

const {clipboard} =require("electron");


export default {
  name: "ResponseEditor",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    readOnly: {
      type: Boolean,
      default: true,
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
    contentType: {
      type: String,
      default: "",
    },
  },
  emits: {
    "update-raw": null,
    "update:modelValue": null,
  },

  setup(props, context) {
    const $bus = inject("$bus");
    const $message = inject("$message");

    const { modelValue, readOnly, tabInfo, contentType } = toRefs(props);
    const codeEditor = ref();
    const beautifyOptions = ref({
      indent_size: "4",
      indent_char: " ",
      max_preserve_newlines: "5",
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: "normal",
      brace_style: "collapse",
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: false,
      wrap_line_length: "70",
      indent_inner_html: false,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false,
    });

    let editor;
    let initVal;

    watch(
      modelValue,
      (newVal, oldVal) => {
        nextTick(() => {
          // if (!oldVal) {
          //   // 因 response example 可編輯，須調整小橘點狀態
          //   if (!readOnly.value) {
          //     tabInfo.value.isEditing = false
          //   }
          // }

          if (!editor) {
            return;
          }
          if (!modelValue.value) {
            editor.setValue("");
            return;
          }

          /**
           * NOTE：setValue() 方法會直接替換編輯器中的內容，而不會將這個操作添加到操作紀錄中。因此，撤銷操作無法回復 setValue() 方法所做的更改。
           */
          if (
            contentType.value.includes("application/octet-stream") ||
            contentType.value.includes("xml")
          ) {
            // if (contentType.value.indexOf("application/octet-stream") > -1) {
            monaco.editor.setModelLanguage(editor.getModel(), "xml");
            if (!isChangeEditorContent.value) {
              initVal = handleStr(modelValue.value);
              editor.setValue(initVal);
            }
            // initVal = handleStr(modelValue.value)
            // editor.setValue(initVal)
          } else if (contentType.value.indexOf("text/html") > -1) {
            monaco.editor.setModelLanguage(editor.getModel(), "html");
            if (!isChangeEditorContent.value) {
              const formatVal = beautify(
                modelValue.value,
                beautifyOptions.value
              );
              editor.setValue(formatVal);
              initVal = formatVal;
            }
          } else {
            monaco.editor.setModelLanguage(editor.getModel(), "json");
            if (!isChangeEditorContent.value) {
              initVal = modelValue.value;
              editor.setValue(modelValue.value);
            }
          }
        });
      },
      {
        immediate: true,
      }
    );

    watch(readOnly, () => {
      if (editor != null) {
        editor.updateOptions({ readOnly: readOnly.value });
      }
    });

    const isChangeEditorContent = ref(false);

    const init = () => {
      // 初始化编辑器
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

      // monaco.editor.setTheme('myTheme')

      editor = monaco.editor.create(codeEditor.value, {
        language: "json",
        tabSize: 4,
        // indentSize: 10,
        scrollBeyondLastLine: false,
        automaticLayout: true, // 自動布局
        readOnly: readOnly.value,
        folding: true, // 摺疊
        minimap: {
          // 縮略圖
          enabled: false,
        },
        lineDecorationsWidth: 55,
        theme: "myTheme",
        renderOptions: {
          // renderControlCharacters: false
        },
        wordWrap: "on", // 啟用自動換行
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        saveTabByHotkey
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        sendRequestByHotkey
      );

      if (!readOnly.value) {
        editor.onDidBlurEditorText((e) => {
          context.emit("update-raw", editor.getValue());

          // NOTE：加這行的話，僅是切換 example response 的 body 與 header會影響undo功能
          // if (isChangeEditorContent.value) {
          //   isChangeEditorContent.value = false
          // }
        });

        // 監聽編輯器內容變化
        // editor.onDidChangeModelContent((event) => {
        //   if (editor.getValue() !== initVal) {
        //     tabInfo.value.isEditing = true // 此為tab的編輯狀態
        //   }

        //   // 透過 Ctrl+F開啟搜尋彈窗時，會使編輯器失去焦點，假如使用replace功能時，會沒更新到編輯器內容，因此需另外做更新動作
        //   if (!editor.hasTextFocus()) {
        //     context.emit('update-raw', editor.getValue())
        //   }
        // })
      }
      if (modelValue.value) {
        if (!editor) return;

        // console.log(monaco.languages.getLanguages())
        if (contentType.value.indexOf("application/octet-stream") > -1) {
          monaco.editor.setModelLanguage(editor.getModel(), "xml");
          initVal = handleStr(modelValue.value);
          editor.setValue(initVal);
        } else if (contentType.value.indexOf("text/html") > -1) {
          monaco.editor.setModelLanguage(editor.getModel(), "html");
          const formatVal = beautify(modelValue.value, beautifyOptions.value);
          editor.setValue(formatVal);
          initVal = formatVal;
        } else {
          monaco.editor.setModelLanguage(editor.getModel(), "json");
          initVal = modelValue.value;
          editor.setValue(modelValue.value);
        }
      }
      // 於editor focus 時新增editor.onDidChangeModelContent事件，避免一開始的預設值影響tab的編輯狀態
      editor.onDidFocusEditorText((e) => {
        if (!readOnly.value) {
          // 監聽編輯器內容變化
          editor.onDidChangeModelContent((event) => {
            isChangeEditorContent.value = true;
            if (editor.getValue() !== initVal) {
              tabInfo.value.isEditing = true; // 此為tab的編輯狀態
            }

            // 透過 Ctrl+F開啟搜尋彈窗時，會使編輯器失去焦點，假如使用replace功能時，會沒更新到編輯器內容，因此需另外做更新動作
            if (!editor.hasTextFocus()) {
              context.emit("update-raw", editor.getValue());
            }
          });
        }
      });
    };

    const handleStr = (content) => {
      const stringifgStr = JSON.stringify(content);
      // '\\uFFFD' 為無效或無法識別的字符 "�"
      let newContent = stringifgStr.replace(/\\u[a-fA-F0-9]{4}/g, "\\uFFFD");
      newContent = newContent.replace(/\\f|\\b/g, " ");
      // "\u007F" 是 Unicode 編碼中的控制字符 DELETE。控制字符 DELETE 是一個不可見的字符，其表示為 U+007F。
      newContent = newContent.replace(/\u007F/g, " ");
      newContent = JSON.parse(newContent);
      return newContent;
    };

    // 快捷鍵 ctrl+enter：送出請求
    const sendRequestByHotkey = () => {
      onBlur();
      // 目前example頁面未有送出請求功能，因此先 return
      if (tabInfo.value.tabType === TypeEnum.example.name) return;

      if (!tabInfo.value.request.url.raw) {
        $message.warning("Request URL is empty");
        return;
      }
      requestData.sendRequest(tabInfo.value);
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

    const actionsRef = ref(null);
    const editorWrapperRef = ref(null);

    onMounted(() => {
      nextTick(() => {
        init();

        const actionsRefHeight = actionsRef.value.offsetHeight;
        // 12px為actionsRef的margin-bottom
        editorWrapperRef.value.style.height = `calc(100% - ${actionsRefHeight}px - 12px)`;
      });
    });

    onBeforeUnmount(() => {
      if (editor) {
        editor.dispose();
        editor = null;
      }
    });


    const copy = () => {
      clipboard.writeText(editor.getValue());
    };

    const search = () => {
      editor.trigger("", "actions.find");
    };

    return {
      codeEditor,
      beautifyOptions,
      copy,
      search,
      actionsRef,
      editorWrapperRef,
    };
  },
};
</script>

<style scoped lang="scss">
.response-editor {
  height: 100%;
}

.editor-wrapper {
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
</style>

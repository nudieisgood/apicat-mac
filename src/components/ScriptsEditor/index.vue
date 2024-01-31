<template>
  <div class="script-wrapper">
    <div class="json-editor">
      <div ref="codeEditor" class="editor" />
    </div>
    <div class="snippets-wrapper">
      <component
        :is="currentComponent"
        :event-type="currentEventType"
        @insert-value="insertValue"
        :tab-info="tabInfo"
      >
      </component>
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
  computed,
  inject,
} from "vue";
import TestsSnippet from "@/components/ScriptsEditor/testsSnippet.vue";
import PreRequestSnippet from "@/components/ScriptsEditor/preRequestSnippet.vue";
import tabsData from "@/store/tabs";
import om from "@/js/utils//om.js";
import requestData from "@/store/requestData";
import ActivityTypeEnum from "@/js/enum/activityTypeEnum";

export default {
  name: "TestsEditor",
  components: {
    TestsSnippet,
    PreRequestSnippet,
  },
  props: {
    // modelValue: String,
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
    currentTabKey: {
      type: String,
      default: "",
    },
  },
  emits: {
    "update:modelValue": null,
  },

  setup(props, context) {
    const $bus = inject("$bus");
    const $message = inject("$message");
    const { readOnly, tabInfo, currentTabName, modelValue, currentTabKey } =
      toRefs(props);

    const currentComponent = computed(() =>
      currentTabName.value === "Tests" ? "TestsSnippet" : "PreRequestSnippet"
    );
    const currentEventType = computed(() =>
      currentTabName.value === "Tests" ? "test" : "prerequest"
    );

    const codeEditor = ref();
    let editor;

    const initVal = ref("");

    watch(readOnly, () => {
      if (editor.value != null) {
        editor.value.setOption("readOnly", readOnly.value);
      }
    });

    // const handleScript = () => {
    //   if (currentTabName.value === "Tests") {
    //     const testsResult = tabsData.getFormattedTestsScript(tabInfo.value);
    //     if (!testsResult) return;
    //     editor.setValue(testsResult);
    //     initVal.value = testsResult;
    //   } else {
    //     const preRequestResult = tabsData.getFormattedPrerequest(tabInfo.value);
    //     if (!preRequestResult) return;
    //     editor.setValue(preRequestResult);
    //     initVal.value = preRequestResult;
    //   }
    // };

    const getType = (thing, isOm) => {
      isOm =
        isOm === undefined ? (typeof isOm === "boolean" ? isOm : false) : false; // Give isOm a default value of false

      switch ((typeof thing).toLowerCase()) {
        case "object":
          return monaco.languages.CompletionItemKind.Class;

        case "function":
          return isOm
            ? monaco.languages.CompletionItemKind.Method
            : monaco.languages.CompletionItemKind.Function;

        default:
          return isOm
            ? monaco.languages.CompletionItemKind.Property
            : monaco.languages.CompletionItemKind.Variable;
      }
    };

    let completionProvider;
    const isCompletionProviderRegistered = ref(false);

    const ShowAutocompletion = (obj) => {
      // Disable default autocompletion for javascript
      // monaco.languages.typescript.javascriptDefaults.setCompilerOptions({ noLib: true }) → 會報錯，所以改用下一行
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      completionProvider = monaco.languages.registerCompletionItemProvider(
        "javascript",
        {
          triggerCharacters: ["."],
          provideCompletionItems: (model, position, token) => {
            const lastChars = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 0,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const words = lastChars.replace("\t", "").split(" ");

            const activeTyping = words[words.length - 1];

            const isOm = activeTyping.charAt(activeTyping.length - 1) === ".";

            // Array of autocompletion results
            const result = [];

            // Used for generic handling between member and non-member objects
            let lastToken = obj;
            // let prefix = ''
            if (isOm) {
              const parents = activeTyping
                .substring(0, activeTyping.length - 1)
                .split(".");

              lastToken = obj[parents[0]];

              // prefix = parents[0]

              for (let i = 1; i < parents.length; i++) {
                let propToLookFor = parents[i];

                const isPropAnArray =
                  propToLookFor.charAt(propToLookFor.length - 1) === "]";
                if (isPropAnArray) {
                  propToLookFor = propToLookFor.split("[")[0];
                }

                if (
                  Object.prototype.hasOwnProperty.call(lastToken, propToLookFor)
                ) {
                  // prefix += '.' + propToLookFor

                  lastToken = lastToken[propToLookFor];

                  if (isPropAnArray && Array.isArray(lastToken)) {
                    lastToken = lastToken[0];
                  }
                } else {
                  // Not valid

                  return result;
                }
              }

              // prefix += '.'
            }

            // Array properties
            if (Array.isArray(lastToken)) lastToken = { length: 0 };
            for (const prop in lastToken) {
              // Do not show properites that begin with "__"
              if (
                Object.prototype.hasOwnProperty.call(lastToken, prop) &&
                !prop.startsWith("__")
              ) {
                // Get the detail type (try-catch) incase object does not have prototype
                let details = "";
                try {
                  // eslint-disable-next-line no-proto
                  details = lastToken[prop].__proto__.constructor.name;

                  // details = lastToken[prop].__proto__.constructor.name
                } catch (e) {
                  details = typeof lastToken[prop];
                }

                // Create completion object
                // console.log(details)
                const tpPush = {
                  label: prop,
                  kind: getType(lastToken[prop], isOm),
                  // detail: 'deeeee',
                  detail: details,
                  insertText: prop,
                };

                // Change insertText and documentation for functions
                if (tpPush.detail.toLowerCase() === "function") {
                  tpPush.insertText += "(";
                  tpPush.documentation = lastToken[prop]
                    .toString()
                    .split("{")[0]; // Show function prototype in the documentation popup
                }

                // Add to final results
                result.push(tpPush);
              }
            }

            return { suggestions: result };
          },
        }
      );
      isCompletionProviderRegistered.value = true;
    };

    const init = () => {
      // ShowAutocompletion({ om })

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
        language: "javascript",
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
        wordWrap: "on", // 啟用自動換行
      });

      // handleScript();

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        saveTabByHotkey
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        sendRequestByHotkey
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

      // pre-request script 與 tests 是用 v-show控制，原本是於mounted註冊，但會重複註冊導致選項重複，為避免此狀況，於focus在註冊 registerCompletionItemProvider，

      editor.onDidFocusEditorText((e) => {
        ShowAutocompletion({ om });
      });

      if (modelValue.value) {
        if (!editor) return;
        editor.setValue(modelValue.value);

        // // 預設初始值後，接著綁定 onDidChangeModelContent 監聽編輯器內容變化；若於預設初始值前綁定，會被視為有內容變化而影響判斷 tab 的編輯狀態
        // editor.onDidChangeModelContent((event) => {
        //   const value = editor.getValue();
        //   context.emit("update:modelValue", value);
        //   // // 透過 Ctrl+F開啟搜尋彈窗時，會使編輯器失去焦點，假如使用replace功能時，會沒更新到編輯器內容，因此需另外做更新動作
        //   // if (!editor.hasTextFocus()) {
        //   // if (currentTabName.value === "Tests") {
        //   //   tabsData.setTestsScript(editor.getValue(), "test", tabInfo.value);
        //   // } else {
        //   //   tabsData.setPrerequest(
        //   //     editor.getValue(),
        //   //     "prerequest",
        //   //     tabInfo.value
        //   //   );
        //   // }
        //   // }
        // });
      }

      // 一開始進入此畫面時(編輯器非 focus 狀態)，為了避免預設值影響判斷編輯狀態，故添加此判斷
      // if (!editor.hasTextFocus()) {
      editor.onDidChangeModelContent((event) => {
        const value = editor.getValue();
        context.emit("update:modelValue", value);
      });
      // }
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

    // 點選snippets插入值
    const insertValue = (snippet) => {
      const currentPosition = editor.getPosition();
      editor.executeEdits("", [
        {
          range: new monaco.Range(
            currentPosition.lineNumber,
            currentPosition.column,
            currentPosition.lineNumber,
            currentPosition.column
          ),
          text: snippet,
          forceMoveMarkers: true,
        },
      ]);

      updateModelValue();
    };

    const updateModelValue = () => {
      let findScript = tabInfo.value.event.find(
        (e) => e.listen === currentTabKey.value
      );

      if (findScript) {
        findScript.script.exec = editor.getValue().split("\n");
      }
    };
    // const updateModelValue = () => {
    //   let findScript;
    //   if (currentTabName.value === "Tests") {
    //     findScript = tabInfo.value.event.find((e) => e.listen === "test");
    //   } else {
    //     findScript = tabInfo.value.event.find((e) => e.listen === "prerequest");
    //   }

    //   if (findScript) {
    //     findScript.script.exec = editor.getValue().split("\n");
    //   }
    // };

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
      insertValue,
      updateModelValue,
      codeEditor,
      ShowAutocompletion,
      onBlur,
      currentComponent,
      currentEventType,
    };
  },
};
</script>

<style scoped lang="scss">
.script-wrapper {
  height: 100%;
  display: flex;
}

.json-editor {
  height: 100%;
  flex-basis: 80%;
}

.snippets-wrapper {
  padding-left: 8px;
  flex-basis: 20%;
}

.editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid $secondary-light-grey;
  border-radius: 4px;
}
</style>

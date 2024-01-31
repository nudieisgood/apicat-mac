<template>
  <!-- 因無法修改 @leyton-techlab/vue-input-highlighter 套件內容，用該套件原本內容另外做成組件(部分有調整) -->
  <div
    contenteditable="true"
    ref="inputRef"
    @keyup="onKeyup"
    class="url-input-highlighter"
  >
  </div>
</template>
<script>
import { ref, toRefs, onMounted } from "vue";

export default {
  name: "UrlInputHighlighter",
  props: {
    modelValue: String,
    rules: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: "",
    },
  },
  emits: {
    "update:modelValue": null,
    highlight: null,
    highlights: null,
  },
  setup(props, context) {
    const { modelValue, placeholder, rules } = toRefs(props);
    const inputRef = ref("");
    const currentModelValue = ref(modelValue.value);

    const g = []; // 較驗規則相關
    let i = [];
    for (const e of rules.value)
      e instanceof RegExp
        ? g.push({
            regex: e,
            class: "",
            style: "",
            tag: f,
          })
        : e instanceof Object &&
          g.push({
            regex: e.regex,
            class: e.class ? e.class : "",
            style: e.style ? e.style : "",
            tag: e.tag ? e.tag : f,
          });

    const setInputRefHTML = () => {
      const e = handleSpecialChar(currentModelValue.value);
      const t = handleHTMLTag(e);
      inputRef.value.innerHTML = t;
    };

    const handleHTMLTag = (e) => {
      for (const t of g) {
        e = e.replaceAll(
          t.regex,
          `<${t.tag} class="${t.class}" style="${t.style}">$1</${t.tag}>`
        );
        return e;
      }
    };

    const handleSpecialChar = (e) =>
      e
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    onMounted(() => {
      setInputRefHTML();
    });

    /**
     * 定義了一個遞迴函數 u，其目的是在給定的 DOM 元素中，根據傳入的條件訂為某個特定的子節點，並返回該節點在文本中的位置
     * @param {*} e 待搜索的 DOM 元素
     * @param {*} t 目標節點
     * @param {*} o 目標節點在文本中的偏移量
     * @param {*} l 一個對象，包含 pos 表示當前搜索位置和 done 表示搜索是否完成的狀態
     */

    const handleDom = (e, t, o, l) => {
      if (l.done) return l;
      let n = null;
      if (e.childNodes.length == 0) l.pos += e.textContent.length;
      else
        for (let h = 0; h < e.childNodes.length && !l.done; h++) {
          if (((n = e.childNodes[h]), n === t))
            return (l.pos += o), (l.done = !0), l;
          handleDom(n, t, o, l);
        }
      return l;
    };

    /**
     *
     * @param {*} e 待搜索的 DOM 元素
     * @param {*} t 表示選擇區域的範圍（Range 對象）
     * @param {*} o 一個對象，包含 pos 表示當前搜索位置和 done 表示搜索是否完成的狀態
     */
    const handleDom1 = (e, t, o) => {
      if (o.done) return t;
      if (e.childNodes.length == 0) {
        if (e.textContent.length >= o.pos) {
          t.setStart(e, o.pos);
          o.done = !0;
        } else {
          o.pos = o.pos - e.textContent.length;
        }
      } else {
        for (let l = 0; l < e.childNodes.length && !o.done; l++) {
          let n = e.childNodes[l];
          handleDom1(n, t, o);
        }
      }

      return t;
    };

    // 從一個數組 e 中移除另一個數組 i 中存在的元素，並返回剩餘的元素數組
    const handleDuplicate = (e) => {
      const t = Array.from(e);
      for (let j = 0; j < i.length; j++) {
        const o = i[j];
        const index = t.indexOf(o);
        if (index > -1) {
          t.splice(index, 1);
        }
      }
      return t;
    };

    const onHighlight = () => {
      const e = Array.from(inputRef.value.children).map((t) => t.innerHTML);

      e.length > i.length && context.emit("highlight", handleDuplicate(e));
      i = e;
      context.emit("highlights", i);
    };

    // 原本是綁 input 事件，陰晦更改 DOM 元素的 innerHTMl，改在 keyup 對輸入框內容處理 highlight
    const onKeyup = (event) => {
      if (event.isComposing) return; // 避免在中文輸入法的狀況下，輸入數字或其他特殊字符出現重複的問題
      currentModelValue.value = inputRef.value.textContent;
      const e = window.getSelection();
      let t = e.focusNode;
      let o = e.focusOffset;
      let l = handleDom(inputRef.value, t, o, { pos: 0, done: !1 });
      o === 0 && (l.pos += 0.5);
      setInputRefHTML();
      e.removeAllRanges();
      const n = handleDom1(inputRef.value, document.createRange(), {
        pos: l.pos,
        done: !1,
      });
      n.collapse(!0);

      e.addRange(n);
      onHighlight();
      context.emit("update:modelValue", currentModelValue.value);
    };

    return {
      inputRef,
      onKeyup,
    };
  },
};
</script>

<style lang="scss" scoped>
.url-input-highlighter {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;

  &:focus {
    outline: 0px solid transparent;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>

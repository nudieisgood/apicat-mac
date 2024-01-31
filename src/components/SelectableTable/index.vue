<template>
  <!-- 大多有用到表格的畫面有選取的功能，故將表格做成共用組件 -->
  <div :id="`${tableType}-selectable-table`" class="selectable-table-wrapper" ref="selectableTableRef"
    @mousedown="handleMouseDown($event)">
    <!-- 用於測試 mousedown 的位置-->
    <!-- <div id="circle"></div> -->
    <div class="selectable-table__header">
      <span>{{ handleTableTitle() }}</span>
      <span class="selectable-table__toggle-text" v-if="tableType === 'Headers'"
        @click="isHiddenSystemRows = !isHiddenSystemRows">{{ isHiddenSystemRows ? `${generatedHeadersNum} hidden` : `Hide
        auto - generated headers` }}</span>
      <a-button class="editable-add-btn" @click="addRow" style="margin-bottom: 8px">Add row</a-button>
    </div>
    <a-table :row-selection="{
      selectedRowKeys: selectedRowKeys,
      onSelect: onSelectRow,
      onSelectAll: onSelectAllRow,
      getCheckboxProps: getCheckboxProps,
    }" :data-source="tableData" :columns="columns" bordered :pagination="false" :rowKey="(record) => record.id"
      :row-class-name="(record) => handleClassName(record)" :scroll="scrollSetting">
      <template #bodyCell="{ column, record, index }">
        <div class="editable-cell">
          <div class="editable-cell-upload" v-if="column.key === 'value' && record.type === 'file'">
            <div class="editable-cell-upload-wrapper" v-if="!record.stringList || !record.stringList.length">
              <a-upload class="uploader" name="file" :multiple="true" :beforeUpload="(file, value) => {
                return saveFile(record, value);
              }
                " action="#" :showUploadList="false">
                <a-button>Select Files</a-button>
              </a-upload>
            </div>
            <div class="file-tag" v-else>
              <a-tag :closable="true" @close="removeFile(record.id)" v-if="record.stringList">{{
                transformFileName(record.stringList) }}</a-tag>
            </div>
          </div>
          <div class="editable-cell-input" v-else>
            <div v-if="record === defaultData.selectedRecord &&
              column.key === defaultData.selectedCol
              " class="editable-cell-input-wrapper">
              <a-input v-model:value="record[column.key]" @blur="save(record)" @pressEnter="save(record)"
                ref="rowInputRef" :placeholder="`${column.dataIndex}`" @input="handleInput(record)" id="rowInput" />
            </div>
            <div v-else class="editable-cell-text-wrapper" :tabindex="index">
              <p @click="edit(record, column.key, index)"> {{ record[column.key] ? record[column.key] : column.dataIndex
              }} </p>
              <div class="editable-cell-select-wrapper" v-if="column.key === 'key' && tableType === 'FormData'">
                <a-select v-model:value="record.type" @change="changeColType" placeholder="select">
                  <a-select-option :value="type.value" v-for="(type, id) in typeArr" :key="id"> {{ type.label }}
                  </a-select-option>
                </a-select>
              </div>
              <a v-if="checkIsShowDeleteIcon(column)" class="btn-delete" @click="remove(record)"><close-outlined /></a>
            </div>
          </div>
        </div>
      </template>
    </a-table>
    <div class="mask" :id="`${tableType}-mask`" v-if="isShowSelectedRangeMask"
      :style="`width:${maskWidth};left:${maskLeft};height:${maskHeight};top:${maskTop}`" />
  </div>
</template>

<script>
import {
  reactive,
  ref,
  toRefs,
  watchEffect,
  nextTick,
  watch,
  onMounted,
  computed,
  onBeforeUnmount,
} from "vue";
import tabsData from "@/store/tabs";
import Helper from "@/js/utils/helper";
import workspaceData from "@/store/workspace";
import store from "@/store";

// const electron = window.require("electron");
// const clipboard = electron.clipboard;
const { clipboard } = require('electron');
// import { clipboard } from "electron";

export default {
  props: {
    tableData: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Array,
      default: () => [],
    },
    requestUrl: {
      type: String,
      default: undefined,
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
    tableType: {
      type: String,
      default: "",
    },
    scroll: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "remove-row": null,
    "edit-row": null,
    "refresh-url": null,
    "update-query-data": null,
  },
  setup(props, context) {
    const { tableData, columns, tableType, scroll } = toRefs(props);

    const rowInputRef = ref();

    const defaultData = reactive({
      selectedCol: "",
      selectedRecord: "",
      selectedIndex: null,
      selectedType: "",
    });

    const state = reactive({
      selectedRowKeys: [],
      loading: false,
    });

    /**
     * @param {Boolean} isEdited - true：有在畫面操作勾選區域或已儲存過資料；false：新增一行時的狀態
     * 用於判斷是否自動勾選
     */

    const onSelectRow = (record) => {
      record.disabled = !record.disabled;
      state.selectedRowKeys = tableData.value
        .filter((e) => !e.disabled)
        .map((e) => e.id);

      record.isEdited = true;
      if (tableType.value === "Params") {
        context.emit("refresh-url");
      }
      // tabInfo.value.isEditing = true; // 此為tab的編輯狀態
    };

    const onSelectAllRow = (selected, selectedRows) => {
      tableData.value.forEach((row) => {
        row.disabled = !selected;
        row.isEdited = true;
      });
      state.selectedRowKeys = tableData.value
        .filter((e) => !e.disabled)
        .map((e) => e.id);

      if (tableType.value === "Params") {
        context.emit("refresh-url");
      }

      // tabInfo.value.isEditing = true; // 此為tab的編輯狀態
    };

    const scrollSetting = ref({});

    watchEffect(() => {
      if (tableData.value && tableData.value.length > 0) {
        state.selectedRowKeys = tableData.value
          .filter((e) => !e.disabled)
          .map((e) => e.id);
      }
    });

    const edit = (record, col, index) => {
      // context.emit("edit-row", {record, col, index});
      defaultData.selectedRecord = record;
      defaultData.selectedCol = col;
      defaultData.selectedIndex = index;

      nextTick(() => {
        rowInputRef.value.focus();
        selectableTableRef.value.onkeydown = keyFunc;
        // document.onkeydown = keyFunc;
      });
    };

    const handleInput = (record, $event) => {
      if (record.key || record.value) {
        if (
          Object.prototype.hasOwnProperty.call(record, "isEdited") &&
          !record.isEdited
        ) {
          record.disabled = false;

          if (!state.selectedRowKeys.some((e) => e === record.id)) {
            state.selectedRowKeys.push(record.id);
          }
        }
      }

      if (tableType.value === "Params") {
        context.emit("refresh-url");
      }
    };

    const save = (record) => {
      defaultData.selectedCol = undefined;
      defaultData.selectedRecord = undefined;
      defaultData.selectedIndex = null;
      window.addEventListener("keydown", copy);
      window.addEventListener("keydown", paste);
      document.onkeydown = null;
    };

    const remove = (record) => {
      // context.emit("remove-row", record);
      const index = tableData.value.findIndex((e) => e === record);
      if (index > -1) {
        tableData.value.splice(index, 1);
      }

      if (tableType.value === "Params") {
        context.emit("refresh-url");
      }
    };

    const selectableTableRef = ref();
    const startX = ref(null);
    const startY = ref(null);
    const endX = ref(null);
    const endY = ref(null);
    const isShowSelectedRangeMask = ref(false);

    const handleMouseDown = (e) => {
      const rect = selectableTableRef.value.getBoundingClientRect();

      // 除錯用：顯示圓點確認滑鼠點擊位置
      // const circle = document.getElementById("circle");
      // circle.style.display = "block"; // 顯示圈圈
      // circle.style.left = `${e.clientX - rect.left}px`; // 調整圈圈的水平位置
      // circle.style.top = `${e.clientY - rect.top}px`; // 調整圈圈的垂直位置

      // console.log(
      //   `滑鼠烙下的位置:__`,
      //   `left: ${e.clientX - rect.left}px`,
      //   `top: ${e.clientY - rect.top}px`
      // );

      const hasButtonEl = e.path.find((el) => el && el.tagName === "BUTTON");
      const hasDeleteEl = e.path.find((el) => {
        let str = el.className;
        return (
          str && typeof str === "string" && str.indexOf("anticon-close") > -1
        );
      });

      // 如果為新增按鈕 / 刪除按鈕，則不觸發選取表格事件
      if (hasButtonEl || hasDeleteEl) {
        return;
      }

      if (e.target.nodeName === "P" || e.target.nodeName === "INPUT") {
        // 表示在輸入框進行操作，不觸發選取表格事件
        return;
      }

      isShowSelectedRangeMask.value = true;
      startX.value = e.clientX - rect.left;
      startY.value = e.clientY - rect.top;
      endX.value = e.clientX - rect.left;
      endY.value = e.clientY - rect.top;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      tableData.value.forEach((e) => {
        e.checked = false;
      });
    };

    const handleMouseMove = (e) => {
      const rect = selectableTableRef.value.getBoundingClientRect();
      endX.value = e.clientX - rect.left;
      endY.value = e.clientY - rect.top;

      // ----- 下方為原本
      // endX.value = e.clientX;
      // endY.value = e.clientY;
    };

    const handleMouseUp = (e) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      isShowSelectedRangeMask.value = false; // 原本寫 false
      if (!(startX.value === endX.value && startY.value === endY.value)) {
        handleDomSelect();
      }
      reset();
    };

    const maskWidth = computed(
      () => `${Math.abs(endX.value - startX.value)}px`
    );
    const maskHeight = computed(
      () => `${Math.abs(endY.value - startY.value)}px`
    );

    const maskLeft = computed(() => `${Math.min(startX.value, endX.value)}px`);
    const maskTop = computed(() => `${Math.min(startY.value, endY.value)}px`);

    const handleDomSelect = () => {
      const domMask = document.getElementById(`${tableType.value}-mask`);
      // const domMask = document.querySelector(".mask");

      const reactSelect = domMask.getClientRects()[0];
      const selectKeys = [];
      const dom = selectableTableRef.value;
      dom.querySelectorAll(".ant-table-row").forEach((node, index) => {
        const rects = node.getClientRects()[0];
        if (Helper.domInRange(rects, reactSelect) === true) {
          selectKeys.push(index);
        }
      });

      tableData.value.map((item, index) => {
        if (selectKeys.indexOf(index) > -1) {
          item.checked = true;
        }
        return item;
      });

      // tableData.value = tableData.value.map((item, index) => {
      //   if (selectKeys.indexOf(index) > -1) {
      //     item.checked = true;
      //   }
      //   return item;
      // });

      duplicateRowData();
    };

    const reset = () => {
      startX.value = 0;
      startY.value = 0;
      endX.value = 0;
      endY.value = 0;
    };

    const selectedData = ref([]);
    const duplicateRowData = () => {
      selectedData.value = [];
      selectedData.value = JSON.parse(
        JSON.stringify(
          tableData.value.filter((item) => {
            return item.checked;
          })
        )
      );
    };

    const copy = (e) => {
      if (e.keyCode === 67 && e.ctrlKey) {
        const selection = window.getSelection().toString();
        if (selection) {
          clipboard.writeText(selection);
          selectedData.value = [];
        } else if (selectedData.value.length > 0) {
          clipboard.writeText(JSON.stringify(selectedData.value));
        }
      }
    };

    const pasteRowData = () => {
      // NOTE：如果複製貼上後更新 row id，再刪除副致的那份，這樣編輯狀態會受影響
      tableData.value.splice(
        defaultData.selectedIndex,
        1,
        ...JSON.parse(JSON.stringify(selectedData.value))
      );
      tabsData.initElementId(tableData.value);
      // context.emit("update-query-data", tempArr);
      defaultData.selectedCol = undefined;
      defaultData.selectedRecord = undefined;
      defaultData.selectedIndex = null;
    };

    // paste data by "ctrl + V"
    const paste = (e) => {
      if (e.keyCode === 86 && e.ctrlKey) {
        const text = clipboard.readText();

        const result = Helper.isJsonString(text);
        if (result) {
          if (defaultData.selectedIndex >= 0) {
            pasteRowData();
          }
        }
      }
    };

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {
    //     // const dom = selectableTableRef.value;
    //     // if (newVal !== oldVal) {
    //     //   nextTick(() => {
    //     //     boxScreenLeft.value = dom.getBoundingClientRect().left;
    //     //   });
    //     // }
    //   }
    // );

    const scrollXWidth = ref(1200);
    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    onMounted(() => {
      const dom = selectableTableRef.value;

      nextTick(() => {
        if (JSON.stringify(scroll.value) !== "{}") {
          scrollSetting.value = { ...scroll.value };
        } else {
          scrollSetting.value = isVerticalMode.value ? { y: 245 } : { y: 595 };
        }
      });

      window.addEventListener("keydown", paste);
      window.addEventListener("keydown", copy);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", paste);
      window.removeEventListener("keydown", copy);

      document
        .querySelectorAll(".selectable-table-wrapper")
        .forEach((node, index) => {
          node.removeEventListener("mousedown", handleMouseDown);
        });

      // tableDom.removeEventListener("mousedown", handleMouseDown);
      tableData.value.forEach((e) => {
        delete e.checked;
      });
    });

    // 透過鍵盤上的Tab、上、下、左、右切換輸入框
    const keyFunc = (event) => {
      const inputDom = document.getElementById("rowInput");
      if (event.keyCode === 40) {
        // 按下
        const oldIndex = defaultData.selectedIndex;
        const currentCol = defaultData.selectedCol;
        const newIndex = oldIndex + 1;
        if (newIndex === tableData.value.length) {
          return;
        }
        event.preventDefault();
        setFocus(tableData.value[newIndex], currentCol, newIndex);
      } else if (event.keyCode === 38) {
        // 按上
        const oldIndex = defaultData.selectedIndex;
        const currentCol = defaultData.selectedCol;
        const newIndex = oldIndex - 1;

        if (newIndex < 0) {
          return;
        }
        event.preventDefault();
        setFocus(tableData.value[newIndex], currentCol, newIndex);
      } else if (event.keyCode === 37) {
        // 按左：光標位置在該input的最前面才能換至上一欄
        if (inputDom.selectionStart >= 1) {
          return;
        }
        event.preventDefault();
        const currentRowIndex = defaultData.selectedIndex;
        const currentColIndex = columns.value.findIndex(
          (col) => col.dataIndex === defaultData.selectedCol
        );
        const newColIndex = currentColIndex - 1;
        if (newColIndex < 0) {
          // 若在第一欄，切換至上一列
          const newRowIndex = currentRowIndex - 1;
          if (newRowIndex < 0) {
            return;
          }

          setFocus(
            tableData.value[newRowIndex],
            columns.value[columns.value.length - 1].dataIndex,
            newRowIndex
          );
          return;
        }
        setFocus(
          tableData.value[currentRowIndex],
          columns.value[newColIndex].dataIndex,
          currentRowIndex
        );
      } else if (event.keyCode === 39) {
        // 按右：光標位置在該input的最後面才能換至下一欄
        if (inputDom.selectionStart < inputDom.value.length) {
          return;
        }
        event.preventDefault();
        const currentRowIndex = defaultData.selectedIndex;
        const currentColIndex = columns.value.findIndex(
          (col) => col.dataIndex === defaultData.selectedCol
        );
        const newColIndex = currentColIndex + 1;
        if (newColIndex === columns.value.length) {
          // 若在最後一欄，切換至下一列
          const newRowIndex = currentRowIndex + 1;
          if (newRowIndex === tableData.value.length) {
            return;
          }
          setFocus(
            tableData.value[newRowIndex],
            columns.value[0].dataIndex,
            newRowIndex
          );
          return;
        }

        setFocus(
          tableData.value[currentRowIndex],
          columns.value[newColIndex].dataIndex,
          currentRowIndex
        );
      } else if (event.keyCode === 9) {
        // 按Tab
        event.preventDefault();
        const currentRowIndex = defaultData.selectedIndex;
        const currentColIndex = columns.value.findIndex(
          (col) => col.dataIndex === defaultData.selectedCol
        );
        const newColIndex = currentColIndex + 1;
        if (newColIndex === columns.value.length) {
          // 若在最後一欄，切換至下一列
          const newRowIndex = currentRowIndex + 1;
          if (newRowIndex === tableData.value.length) {
            return;
          }

          setFocus(
            tableData.value[newRowIndex],
            columns.value[0].dataIndex,
            newRowIndex
          );
          return;
        }

        setFocus(
          tableData.value[currentRowIndex],
          columns.value[newColIndex].dataIndex,
          currentRowIndex
        );
      }
    };

    const setFocus = (record, col, index) => {
      save();
      nextTick(() => {
        edit(record, col, index);
      });
    };

    const checkIsShowDeleteIcon = (column) => {
      if (
        tableType.value === "Params" ||
        tableType.value === "Environment" ||
        tableType.value === "Global" ||
        tableType.value === "Collection"
      ) {
        if (column.key === "value") return true;
      }

      if (
        tableType.value === "Headers" ||
        tableType.value === "FormData" ||
        tableType.value === "UrlEncoded"
      ) {
        if (column.key === "description") return true;
      }

      return false;
    };

    const typeArr = [
      {
        id: 0,
        label: "Text123",
        value: "text",
      },
      {
        id: 1,
        label: "File",
        value: "file",
      },
    ];

    const changeColType = (type) => {
      defaultData.selectedType = type;
    };

    const saveFile = (record, value) => {
      record.stringList = value;
      record.stringList = value.map((e) => `file://${e.path}`).join(",");

      defaultData.selectedCol = "";
      defaultData.selectedRecord = "";

      return false;
    };

    const removeFile = (id) => {
      const index = tableData.value.findIndex((e) => e.id === id);
      if (index > -1) {
        tableData.value[index].stringList = "";
      }
    };

    // 若該列type = file，轉換value欄位呈現文字
    const transformFileName = (value) => {
      const stringArr = value.split(",");
      if (stringArr.length > 1) {
        return `${stringArr.length} files selected`;
      }
      const reg = /[^\\]+(?!.*\\)/g;
      const text = value.match(reg)[0];
      return text;
    };

    const addRow = () => {
      let newRow = {};

      switch (tableType.value) {
        case "Params":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            disabled: true,
            isEdited: false,
          };
          break;
        case "Headers":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            description: "",
            disabled: true,
            isEdited: false,
          };
          break;
        case "FormData":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            description: "",
            type: "text",
            // src: [],
            disabled: true,
            isEdited: false,
            stringList: null,
          };
          break;
        case "UrlEncoded":
          newRow = {
            index: Helper.generateHashKey(5),
            key: "",
            value: "",
            description: "",
            disabled: true,
            isEdited: false,
          };
          break;
        case "Collection":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            disabled: true,
            isEdited: false,
          };
          break;
        case "Environment":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            type: "default",
            disabled: true,
            isEdited: false,
          };
          break;
        case "Global":
          newRow = {
            id: Helper.generateHashKey(5),
            key: "",
            value: "",
            disabled: true,
            isEdited: false,
          };
          break;
        default:
          return {};
      }

      tableData.value.push(newRow);
    };

    const handleTableTitle = () => {
      switch (tableType.value) {
        case "Params":
          return "Query Params";
        case "Headers":
          return "Headers";
        case "FormData":
          return "";
        case "UrlEncoded":
          return "";
        case "Collection":
          return "";
        case "Environment":
          return "";
        case "Global":
          return "";
        default:
          return "";
      }
    };

    const handleClassName = (record) => {
      let classNameContent = "";
      if (record.checked) {
        classNameContent += "checked-background";
      }

      if (record.isSystem && isHiddenSystemRows.value) {
        classNameContent += " hidden-row";
      }
      return classNameContent;
    };

    const isHiddenSystemRows = ref(false);

    const generatedHeadersNum = computed(() => {
      return tableData.value.filter((row) => row.isSystem).length;
    });

    const getCheckboxProps = (record) => {
      if (!tableType.value === "Headers") return;
      // 目前 Header 預設項目在不帶的狀況下，axios 套件一樣會自動補上，故先禁止使用者勾選
      return {
        disabled: record.isSystem,
      };
    };

    return {
      scrollXWidth,
      defaultData,
      rowInputRef,
      onSelectRow,
      onSelectAllRow,
      edit,
      save,
      remove,
      tabsData,
      ...toRefs(state),
      handleInput,
      selectableTableRef,
      handleMouseDown,
      handleMouseMove,
      maskWidth,
      maskHeight,
      maskLeft,
      maskTop,
      isShowSelectedRangeMask,
      startX,
      startY,
      endX,
      endY,
      duplicateRowData,
      checkIsShowDeleteIcon,
      typeArr,
      changeColType,
      saveFile,
      removeFile,
      transformFileName,
      scrollSetting,
      addRow,
      handleTableTitle,
      handleClassName,
      isHiddenSystemRows,
      generatedHeadersNum,
      getCheckboxProps,
    };
  },
};
</script>

<style lang="scss" scoped>
.editable-cell {
  .editable-cell-text-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  p {
    flex: 1;
    margin-bottom: 0;
    color: #9d9d9d;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }
}

.mask {
  position: absolute;
  background: #409eff;
  opacity: 0.4;
  z-index: 10000000000000;
}

// 除錯用
#circle {
  width: 20px;
  height: 20px;
  border: 2px solid rgb(210, 30, 30);
  border-radius: 50%;
  position: absolute;
  pointer-events: none;
  /* 這可以讓滑鼠點擊事件穿透這個元素 */
  display: none;
  /* 初始時隱藏，之後會使用 JavaScript 來顯示 */
  z-index: 100000;
  background-color: chocolate;
  // transform: translate(-50%, -50%);
}

.selectable-table-wrapper {
  position: relative;
  overflow: scroll;

  &:deep(.checked-background) td {
    background-color: rgb(242, 241, 241) !important;
  }

  // &:deep(.is-system) td {
  //   background-color: #eef9fd !important;
  // }

  &:deep(.hidden-row) {
    display: none;
  }

  &:deep(.ant-table-row) {
    position: relative;

    .btn-delete {
      // position: absolute;
      display: none;
      // top: 50%;
      // transform: translateY(-50%);
      color: $primary-dark-grey;
      //  right: 20px;
    }

    &:hover {
      .btn-delete {
        display: inline-block;
      }
    }
  }
}

.selectable-table {
  &__header {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
    font-weight: 500;
    color: #7b7b7b;

    .editable-add-btn {
      display: block;
      margin-left: auto;
    }
  }

  &__toggle-text {
    display: inline-block;
    margin-left: 10px;
    padding: 0 6px;
    font-size: $text-size-xs;
    border-radius: 12px;
    background-color: $primary-light-grey;
    cursor: pointer;
  }
}

.editable-cell-select-wrapper {
  width: 6rem;

  &:deep(.ant-select) {
    width: 100%;
  }
}
</style>

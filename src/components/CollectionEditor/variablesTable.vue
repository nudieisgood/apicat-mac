<template>
  <div class="variables-table" ref="variableTable">
    <!-- <div class="variables-table__header">
      <span
        >These variables are specific to this collection and its requests.</span
      >
      <a-button
        class="editable-add-btn"
        @click="addRow"
        style="margin-bottom: 8px"
        >Add row</a-button
      >
    </div> -->
    <selectable-table
      ref="selectableTable"
      class="table-container"
      :table-type="'Collection'"
      :columns="columns"
      :table-data="tabInfo.variable"
      :scroll="{ y: 712 }"
    >
    </selectable-table>
  </div>
</template>
<script>
import { ref, toRefs, watch, onMounted, onBeforeUnmount } from "vue";
import Helper from "@/js/utils/helper";
import workspaceData from "@/store/workspace";
import tabsData from "@/store/tabs";
import SelectableTable from "@/components/SelectableTable";

export default {
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  components: {
    SelectableTable,
  },
  setup(props) {
    const { tabInfo } = toRefs(props);
    const columns = [
      {
        title: "VARIABLE",
        dataIndex: "Add a new variable",
        key: "key",
        width: "48%",
        // slots: { customRender: "key" },
      },
      {
        title: "VALUE",
        dataIndex: "value",
        key: "value",
        width: "48%",
        // slots: { customRender: "value" },
        // render: () => <Input />
      },
    ];

    /**
     * @param {Boolean} isEdited - true：有在畫面操作勾選區域或以儲存過資料；false：新增一行時的狀態
     * 用於判斷是否自動勾選
     */

    const addRow = () => {
      tabInfo.value.variable.push({
        id: Helper.generateHashKey(5),
        key: "",
        value: "",
        disabled: true,
        isEdited: false,
      });
    };

    const variableTable = ref();

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    onMounted(() => {});

    onBeforeUnmount(() => {});

    return {
      columns,
      addRow,
      // setVariableData,
      variableTable,
      tabsData,
    };
  },
};
</script>
<style lang="scss" scoped>
$requester-tabs-header-height: 32px;

.variables-table {
  height: 100%;
  // height: calc(100% - #{$requester-tabs-header-height});

  &__header {
    display: flex;
    align-items: center;
    padding: 0 10px;
    .editable-add-btn {
      display: block;
      margin-left: auto;
    }
  }

  &:deep(
      .ant-table-fixed-header
        > .ant-table-content
        > .ant-table-scroll
        > .ant-table-body
    ) {
    height: 100%;
  }

  &:deep(.ant-table-row) {
    .icon-delete {
      display: none;
      cursor: pointer;
    }

    &:hover {
      .icon-delete {
        display: inline-block;
      }
    }
  }
}
.editable-cell {
  p {
    margin-bottom: 0;
    cursor: pointer;
    color: #9d9d9d;
  }
}

.editable-cell-text-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;

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

.table-container {
  height: calc(100% - 40px);

  &:deep(.checked-background) td {
    background-color: rgb(242, 241, 241);
  }
}
</style>

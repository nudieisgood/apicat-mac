<template>
  <div class="headers-table" ref="headerTable">
    <selectable-table
      ref="selectableTable"
      class="table-container"
      :table-type="'Headers'"
      :columns="columns"
      :table-data="headerData"
    >
    </selectable-table>
  </div>
</template>
<script>
import {
  reactive,
  ref,
  toRefs,
  nextTick,
  watchEffect,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import tabsData from "@/store/tabs";
import Helper from "@/js/utils/helper";
import workspaceData from "@/store/workspace";
import SelectableTable from "@/components/SelectableTable";

export default {
  props: {
    headerArray: {
      type: Array,
      default: () => [],
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  components: {
    SelectableTable,
  },
  setup(props) {
    const { headerArray } = toRefs(props);
    const headerData = ref([]);
    watch(
      headerArray,
      () => {
        headerData.value = headerArray.value;
      },
      {
        immediate: true,
      }
    );
    const columns = [
      {
        title: "KEY",
        dataIndex: "key",
        key: "key",
        width: "30%",
      },
      {
        title: "VALUE",
        dataIndex: "value",
        key: "value",
        width: "30%",
        ellipsis: true,
      },
      {
        title: "DESCRIPTION",
        dataIndex: "description",
        key: "description",
        width: "30%",
      },
    ];

    const data = reactive({
      selectedCol: "",
      selectedRecord: "",
      selectedIndex: null,
    });

    const addRow = () => {
      headerData.value.push({
        id: Helper.generateHashKey(5),
        key: "",
        value: "",
        description: "",
        disabled: true,
        isEdited: false,
      });
    };

    const headerTable = ref();

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    onMounted(() => {});

    onBeforeUnmount(() => {});

    return {
      data,
      columns,
      addRow,
      tabsData,
      headerTable,
      headerData,
    };
  },
};
</script>
<style lang="scss" scoped>
.headers-table {
  overflow-y: auto;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;

    .editable-add-btn {
      display: block;
      margin-left: auto;
    }
  }

  &:deep(.ant-table-row) {
    position: relative;

    .btn-delete {
      // position: absolute;
      display: none;
      // top: 50%;
      // transform: translateY(-50%);
      color: $primary-dark-grey;
    }

    &:hover {
      .btn-delete {
        display: inline-block;
      }
    }
  }
}

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

.table-container {
  &:deep(.checked-background) td {
    background-color: rgb(242, 241, 241);
  }
}
</style>

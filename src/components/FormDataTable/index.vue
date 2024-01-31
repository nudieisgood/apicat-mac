<template>
  <div class="formdata-table" ref="formdataTable">
    <!-- <a-button
      class="editable-add-btn"
      @click="handleAdd"
      style="margin-bottom: 8px"
      >Add row
    </a-button> -->
    <selectable-table
      ref="selectableTable"
      class="table-container"
      :table-type="'FormData'"
      :columns="columns"
      :table-data="formDataList"
    >
    </selectable-table>
  </div>
</template>
<script>
import { ref, toRefs, onMounted, onBeforeUnmount, watch } from "vue";
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
// import DataTypeEnum from '@/js/enum/dataTypeEnum'
import Helper from "@/js/utils/helper";
import workspaceData from "@/store/workspace";
import SelectableTable from "@/components/SelectableTable";

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

export default {
  props: {
    formdataArray: {
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
    const { formdataArray, tabInfo } = toRefs(props);
    const formDataList = ref([]);
    watch(
      formdataArray,
      () => {
        formDataList.value = formdataArray.value;
      },
      {
        immediate: true,
      }
    );

    const handleAdd = () => {
      // requestData.addFormDataRow()
      formDataList.value.push({
        id: Helper.generateHashKey(5),
        key: "",
        value: "",
        description: "",
        type: "text",
        // src: [],
        disabled: true,
        isEdited: false,
        stringList: null,
      });
    };

    const formdataTable = ref();

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    onMounted(() => {});

    onBeforeUnmount(() => {});

    return {
      requestData,
      columns,
      handleAdd,
      tabsData,
      formdataTable,
      formDataList,
    };
  },
};
</script>
<style lang="scss" scoped>
.formdata-table {
  &:deep(.ant-table-row) {
    position: relative;

    .btn-delete {
      // position: absolute;
      display: none;
      // top: 50%;
      // transform: translateY(-50%);
      color: $primary-dark-grey;
      // right: 20px;
    }

    &:hover {
      .btn-delete {
        display: inline-block;
      }
    }
  }
}

.editable-add-btn {
  display: block;
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

.editable-cell-select-wrapper {
  min-width: 65px;

  :deep(.ant-select) {
    width: 100%;
    height: 22px;
  }
}

.editable-cell-upload-wrapper {
  :deep(.ant-upload) {
    height: 22px;
    // padding: 0 15px;
  }

  :deep(.ant-btn) {
    height: 100%;
    padding: 0 15px;
  }
}

.file-tag {
  :deep(.ant-tag) {
    svg {
      width: 14px;
    }
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

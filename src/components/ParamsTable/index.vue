<template>
  <div class="params-table" ref="paramTable">
    <!-- <div class="params-table__header">
      <span>Query Params</span>
      <a-button class="editable-add-btn" @click="add" style="margin-bottom: 8px"
        >Add row</a-button
      >
    </div> -->
    <selectable-table
      ref="selectableTable"
      class="table-container"
      :table-type="'Params'"
      :columns="columns"
      :table-data="paramsData"
      @refresh-url="refreshUrl1"
    >
    </selectable-table>
  </div>
</template>
<script>
import requestData from "@/store/requestData";
import {
  ref,
  toRefs,
  watchEffect,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import tabsData from "@/store/tabs";
import Helper from "@/js/utils/helper";
import workspaceData from "@/store/workspace";
import SelectableTable from "@/components/SelectableTable";

export default {
  props: {
    queryData: {
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
  },
  emits: {
    "update-request-url": null,
    "update-query-data": null,
  },
  components: {
    SelectableTable,
  },
  setup(props, context) {
    const { queryData, requestUrl, tabInfo } = toRefs(props);

    const paramsData = ref([]);

    watch(
      queryData,
      () => {
        paramsData.value = queryData.value;
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
        width: "45%",
        ellipsis: true,
      },
      {
        title: "VALUE",
        dataIndex: "value",
        width: "45%",
        key: "value",
        ellipsis: true,
      },
    ];

    watchEffect(() => {});

    // URL Parameter 處理
    const selectableTable = ref(null);
    const add = () => {
      const paramRow = {
        id: Helper.generateHashKey(5),
        key: "",
        value: "",
        disabled: true,
        isEdited: false,
      };

      paramsData.value.push(paramRow);
    };

    const currentRequestUrl = ref("");

    watch(
      requestUrl,
      () => {
        currentRequestUrl.value = requestUrl.value;
      },
      {
        immediate: true,
      }
    );

    const refreshUrl1 = () => {
      const paramsStr = paramsData.value
        .filter((e) => !e.disabled)
        .map((e) => `${e.key}=${e.value}`)
        .join("&");

      const baseUrl = requestUrl.value.match(/(^https?:\/\/[^?]*)/)
        ? requestUrl.value.match(/(^https?:\/\/[^?]*)/)[1]
        : requestUrl.value.match(/([^?]*)/)[1];

      currentRequestUrl.value = baseUrl;
      if (paramsData.value.length) {
        if (selectableTable.value.selectedRowKeys.length) {
          currentRequestUrl.value += "?" + paramsStr;
        }
      }
      // currentRequestUrl.value = baseUrl + "?" + paramsStr;
      context.emit("update-request-url", currentRequestUrl.value);
    };

    // 原 refreshUrl
    // const refreshUrl = () => {
    //   const paramsStr = paramsData.value
    //     .filter((e) => !e.disabled)
    //     .map((e) => `${e.key}=${e.value}`)
    //     .join("&");

    //   const baseUrl = requestUrl.value.match(/(^https?:\/\/[^?]*)/)
    //     ? requestUrl.value.match(/(^https?:\/\/[^?]*)/)[1]
    //     : requestUrl.value.match(/([^?]*)/)[1];

    //   currentRequestUrl.value = baseUrl;
    //   if (paramsData.value.length) {
    //     if (state.selectedRowKeys.length) {
    //       currentRequestUrl.value += "?" + paramsStr;
    //     }
    //   }
    //   // currentRequestUrl.value = baseUrl + "?" + paramsStr;

    //   context.emit("update-request-url", currentRequestUrl.value);
    // };

    const paramTable = ref();

    // // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    onMounted(() => {});

    onBeforeUnmount(() => {});

    return {
      columns,
      requestData,
      add,
      tabsData,
      // refreshUrl,
      currentRequestUrl,
      paramTable,
      paramsData,
      selectableTable,
      refreshUrl1,
    };
  },
};
</script>

<style lang="scss" scoped>
.params-table {
  // position: relative;
  // overflow-y: scroll;
  height: 100%;

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
}

.table-container {
  height: calc(100% - 40px);

  &:deep(.checked-background) td {
    background-color: rgb(242, 241, 241);
  }
}
</style>

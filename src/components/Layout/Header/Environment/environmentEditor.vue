<template>
  <div id="environment-editor-wrapper">
    <div class="environment-table">
      <selectable-table
        ref="selectableTable"
        class="table-container"
        :table-type="'Environment'"
        :columns="columns"
        :table-data="tabInfo.variable"
        :scroll="{ y: 700 }"
      >
      </selectable-table>
    </div>
  </div>
</template>

<script>
import { toRefs } from "vue";
import workspaceData from "@/store/workspace";
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
      },
      {
        title: "VALUE",
        dataIndex: "value",
        key: "value",
        width: "48%",
      },
    ];

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    return {
      columns,
    };
  },
};
</script>
<style lang="scss" scoped>
$requester-tabs-header-height: 32px;
$environment-table-header-height: 40px;

#environment-editor-wrapper {
  height: calc(100% - #{$requester-tabs-header-height} - 10px);
}

.environment-table {
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    // padding: 0 10px;
    margin-top: 10px;

    .editable-add-btn {
      display: block;
      // margin-left: auto;
    }
  }
}
</style>

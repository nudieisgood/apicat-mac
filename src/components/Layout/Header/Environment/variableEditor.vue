<template>
  <div id="variable-editor-wrapper">
    <div class="variable-table">
      <!-- <div class="mark" v-if="tabInfo.tabType === TypeEnum.globals.name">
        <p>
          Global variables for a workspace are a set of variables that are
          always available within the scope of that workspace.<br />
          They can be viewed and edited by anyone in that workspace.
        </p>
      </div> -->
      <selectable-table
        ref="selectableTable"
        class="table-container"
        :table-type="tableType"
        :columns="columns"
        :table-data="tabInfo.variable"
        :scroll="{ y: 700 }"
      >
      </selectable-table>
    </div>
  </div>
</template>

<script>
import { toRefs, computed } from "vue";
import workspaceData from "@/store/workspace";
import SelectableTable from "@/components/SelectableTable";
import TypeEnum from "@/js/enum/typeEnum.js";

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

    const tableType = computed(() => {
      return tabInfo.value.tabType === TypeEnum.environment.name
        ? "Environment"
        : "Global";
    });

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    return {
      columns,
      tableType,
      TypeEnum,
    };
  },
};
</script>
<style lang="scss" scoped>
$requester-tabs-header-height: 32px;
$variable-table-header-height: 40px;

#variable-editor-wrapper {
  // height: calc(100% - #{$requester-tabs-header-height} - 10px);
  // height: calc(100% - 39px);
  height: 100%;
}

.variable-table {
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

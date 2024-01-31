<template>
  <div class="urlencoded-table" ref="urlencodedTable">
    <!-- <a-button
      class="editable-add-btn"
      @click="handleAdd"
      style="margin-bottom: 8px"
      >Add row
    </a-button> -->
    <selectable-table
      ref="selectableTable"
      class="table-container"
      :table-type="'UrlEncoded'"
      :columns="columns"
      :table-data="urlEncodedList"
    >
    </selectable-table>
  </div>
</template>
<script>
import { reactive, ref, onMounted, toRefs, computed, watch } from "vue";
import requestData from "@/store/requestData";
import SelectableTable from "@/components/SelectableTable";
import workspaceData from "@/store/workspace";
import Helper from "@/js/utils/helper";

export default {
  components: {
    SelectableTable,
  },
  props: {
    urlEncodedArr: {
      type: Array,
      default: () => [],
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  setup(props) {
    const { urlEncodedArr, tabInfo } = toRefs(props);
    const urlEncodedList = ref([]);

    watch(
      urlEncodedArr,
      () => {
        urlEncodedList.value = urlEncodedArr.value;
      },
      {
        immediate: true,
      }
    );

    const columns = [
      {
        title: "KEY",
        dataIndex: "Key",
        key: "key",
        width: "30%",
      },
      {
        title: "VALUE",
        dataIndex: "Value",
        key: "value",
        width: "30%",
      },
      {
        title: "DESCRIPTION",
        dataIndex: "Description",
        key: "description",
        width: "30%",
      },
    ];

    const handleAdd = () => {
      const newData = {
        index: Helper.generateHashKey(5),
        key: "",
        value: "",
        description: "",
        disabled: true,
        isEdited: false,
      };
      urlEncodedList.value.push(newData);
    };

    const urlencodedTable = ref();

    // 開啟/關閉 sidebar 會影響 table 的左邊到視窗左部
    // watch(
    //   () => workspaceData.onCollapse.value,
    //   (newVal, oldVal) => {}
    // );

    const addContentType = () => {
      const obj = {};
      obj.key = "Content-Type";
      obj.value = "application/x-www-form-urlencoded";
      obj.description = "";
      obj.selected = true;
      const findResult = requestData.data.headerArr.find(
        (el) => el.key === "Content-Type"
      );

      if (findResult) {
        findResult.value = obj.value;
      } else {
        requestData.data.headerArr.unshift(obj);
      }
      requestData.handleHeader();
    };

    return {
      requestData,
      columns,
      handleAdd,
      urlEncodedList,
      urlencodedTable,
    };
  },
};
</script>
<style lang="scss" scoped>
.editable-add-btn {
  display: block;
  //margin-left: auto;
}
.editable-cell-text-wrapper {
  p {
    margin-bottom: 0;
  }
}
</style>

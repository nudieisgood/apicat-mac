<template>
  <div class="response-headers-table">
    <a-table
      :columns="columns"
      :data-source="responseDataSource"
      bordered
      :pagination="false"
    >
      <template v-for="col in ['key', 'value']" #[col]="{ record }" :key="col">
        <div class="cell">
          <div class="cell-text-wrapper">
            <p>{{ record[col] }}</p>
          </div>
        </div>
      </template>
    </a-table>
  </div>
</template>
<script>
import { watch, ref, toRefs } from "vue";
import tabsData from "@/store/tabs";

export default {
  props: {
    headerData: {
      type: Object,
      default: () => {},
    },
  },
  setup(props) {
    const { headerData } = toRefs(props);
    const columns = [
      {
        title: "",
        dataIndex: "",
        key: "",
        width: "5%",
      },
      {
        title: "KEY",
        dataIndex: "key",
        key: "key",
        width: "45%",
      },
      {
        title: "VALUE",
        dataIndex: "value",
        key: "value",
        width: "45%",
      },
    ];

    const responseDataSource = ref([]);

    watch(
      headerData,
      () => {
        if (headerData.value) {
          if (Array.isArray(headerData.value)) {
            responseDataSource.value = headerData.value;
          } else {
            responseDataSource.value = tabsData.handleResponseData(
              headerData.value
            );
          }
        }
      },
      {
        immediate: true,
      }
    );

    return {
      columns,
      responseDataSource,
    };
  },
};
</script>

<style lang="scss" scoped>
.cell {
  p {
    margin-bottom: 0;
    color: #9d9d9d;
  }
}

.response-headers-table {
  height: 100%;
  overflow: auto;
}
</style>

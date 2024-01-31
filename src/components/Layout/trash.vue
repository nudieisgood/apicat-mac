<template>
  <div class="trash-wrapper">
    <loading v-if="isShowLoading" />
    <div class="trash-container">
      <div class="header">
        <div class="header__back-btn" @click="hideTrash">
          <span class="header__back-icon" />
          <span class="header__back-text">Back to workspace</span>
        </div>
        <div class="header__title">
          <p>Trash</p>
          <a-button
            @click="beforeDeletePermanently()"
            :disabled="!state.selectedRows.length"
            >Batch Delete</a-button
          >
        </div>
      </div>
      <div class="table-group--empty" v-if="!tableData.length">
        <img
          class="empty-image"
          :src="require('@/assets/img/footer/img-empty-trash.png')"
          alt="image-empty-trash"
        />
        <div class="empty-desc">
          <p class="empty-desc__item--bold empty-desc__item">
            Your trash is empty
          </p>
          <p class="empty-desc__item">Items you delete will show up here.</p>
        </div>
      </div>
      <div class="table-group" v-else>
        <div class="tag-list">
          <div
            class="tag-list__item"
            :class="{ 'tag-list__item--active': tag.isActive }"
            v-for="tag in workspaceTags"
            :key="tag.workspaceId"
            @click="switchStatus(tag)"
          >
            {{ tag.workspaceName }}
          </div>
        </div>

        <a-table
          class="table-group__table"
          :pagination="false"
          :columns="columns"
          :data-source="filterData"
          :rowKey="(record) => record.id"
          :row-selection="{
            selectedRowKeys: state.selectedRowKeys,
            onSelectAll: onSelectAllRow,
            onChange: onSelectChange,
          }"
        >
          <template #bodyCell="{ record, column }">
            <div class="editable-cell">
              <div class="table-btn" v-if="column.dataIndex === 'action'">
                <a @click="restoreData(record)"
                  ><img
                    class="icon-rotate"
                    :src="require('@/assets/img/footer/icon-rotate.svg')"
                    alt="icon-rotate"
                /></a>
                <a @click="beforeDeletePermanently(record)"
                  ><img
                    class="icon-trash"
                    :src="require('@/assets/img/footer/icon-trash.svg')"
                    alt="icon-trash"
                /></a>
              </div>

              <p v-else-if="column.dataIndex === 'type'">
                {{ getRecyclingBinItemName(record[column.key]) }}
              </p>

              <p v-else-if="column.dataIndex === 'deleted time'">
                {{ formatDate(record[column.key]) }}
              </p>

              <p v-else>
                {{ record[column.key] }}
              </p>
            </div>
          </template>
        </a-table>
      </div>
    </div>
  </div>
  <before-delete-dialog
    :dialog-title="`Permanently delete`"
    :dialog-visible="isShowBeforeDeleteDialog"
    v-if="isShowBeforeDeleteDialog"
    @close-dialog="closeBeforeDeleteDialog"
    @delete-current-data="checkDeleteType"
  />
</template>

<script>
import { ref, onMounted, reactive } from "vue";
import {
  getRecyclingBinList,
  restoreRecyclingBinData,
  deleteRecyclingBinData,
} from "@/js/ipc/recyclingBinIPC.js";
import RecyclingBinItemTypeEnum, {
  getRecyclingBinItemName,
} from "@/js/enum/recyclingBinItemTypeEnum.js";
import dayjs from "dayjs";
import Loading from "@/components/Loader/loading";
import BeforeDeleteDialog from "@/components/Layout/beforeDeleteDialog";

export default {
  props: {
    isShowTrash: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Loading,
    BeforeDeleteDialog,
  },
  emits: {
    "hide-trash": null,
  },
  setup(props, context) {
    const columns = [
      {
        title: "Folder",
        dataIndex: "name",
        key: "name",
        width: "22.5%",
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        width: "22.5%",
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "activityType",
        width: "22.5%",
      },
      {
        title: "Deleted time",
        dataIndex: "deleted time",
        key: "updatedAt",
        width: "22.5%",
      },
      {
        title: "operate",
        dataIndex: "action",
      },
    ];

    const tableData = ref([
      {
        workspaceId: 1099,
        workspaceName: "範例工作區名稱",
        itemList: [
          {
            updatedAt: null,
            itemType: 0,
            name: "範例工作區名稱",
            id: 1099,
          },
        ],
      },
      {
        workspaceId: 1098,
        workspaceName: "範例工作區名稱1",
        itemList: [
          {
            updatedAt: null,
            itemType: 4,
            name: "範例工44作區名稱",
            id: 1094,
          },
        ],
      },
    ]);

    const filterData = ref([]);

    const activeKey = ref([]);

    const hideTrash = () => {
      context.emit("hide-trash");
    };

    const isShowLoading = ref(false);

    const openNotification = (type, message) => {
      window.showNotification(type, message);
    };

    const workspaceTags = ref([]);

    const handleWorkspaceTag = (list) => {
      workspaceTags.value = list.map((item) => {
        let isActive = isActiveArray.value.includes(item.workspaceId); // 刪除後會重新取得資料，維持原本已選中的 tag
        return {
          workspaceId: item.workspaceId,
          workspaceName: item.workspaceName,
          // isActive: false,
          isActive,
        };
      });
      if (!workspaceTags.value.length) return;
      if (!isActiveArray.value.length) {
        workspaceTags.value[0].isActive = true; // 一進入頁面時，預設選取第一個工作區
      }
    };

    const handleTableData = (list) => {
      list.forEach((item) => {
        item.activityList.forEach((e) => {
          e.workspaceId = item.workspaceId;
          e.workspaceName = item.workspaceName;
        });
      });
      tableData.value = list.flatMap((obj) => obj.activityList);
    };

    const getRecyclingBinPage = async (isDefault) => {
      isShowLoading.value = true;
      const res = await getRecyclingBinList();
      if (res.code === 20000) {
        handleTableData(res.data);
        handleWorkspaceTag(res.data);
        filter();
      } else {
        openNotification("warn", res.message);
      }

      isShowLoading.value = false;
    };

    const formatDate = (time) => {
      return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
    };

    const restoreData = async (item) => {
      let params = {
        id: item.id,
        activityType: item.activityType,
      };
      const res = await restoreRecyclingBinData(params);
      if (res.code === 20000) {
        getRecyclingBinPage();
        openNotification("success", `${item.name} restored`);
      }
    };

    const isShowBeforeDeleteDialog = ref(false);

    const deleteData = ref({});
    const actionType = ref("single");

    const beforeDeletePermanently = (record) => {
      deleteData.value = record || undefined;
      isShowBeforeDeleteDialog.value = true;
    };

    const checkDeleteType = () => {
      if (!deleteData.value) {
        batchDelete();
      } else {
        deletePermanently();
      }
    };

    // 刪除單筆
    const deletePermanently = () => {
      let key = deleteData.value.activityType;
      let id =
        key === RecyclingBinItemTypeEnum.workspace.value
          ? deleteData.value.workspaceId
          : deleteData.value.id;

      let delString = `${key}=${id}`;

      onDelete(delString);
    };

    // 刪除多筆
    const batchDelete = () => {
      // 先依 activityType 分組
      const groupedByType = state.selectedRows.reduce((acc, obj) => {
        const { activityType, id } = obj;
        if (!acc[activityType]) {
          acc[activityType] = [];
        }
        acc[activityType].push(id);
        return acc;
      }, {});

      // 將分組好的資料轉為所需字串格式
      let delString = Object.entries(groupedByType)
        .map(([key, value]) => `${key}=${value.join(",")}`)
        .join("&");

      onDelete(delString);
    };

    const onDelete = async (params) => {
      const res = await deleteRecyclingBinData(params);

      if (res.code === 20000) {
        getRecyclingBinPage();
        openNotification("success", "Successfully deleted");
      } else {
        openNotification("warn", res.message);
      }
      closeBeforeDeleteDialog();
    };

    const closeBeforeDeleteDialog = () => {
      deleteData.value = {};
      isShowBeforeDeleteDialog.value = false;
    };

    onMounted(async () => {
      await getRecyclingBinPage(true);
    });

    const state = reactive({
      selectedRowKeys: [],
      selectedRows: [],
      // Check here to configure the default column
    });

    const onSelectChange = (selectedRowKeys, selectedRows) => {
      state.selectedRowKeys = selectedRowKeys;
      state.selectedRows = selectedRows;
    };

    const onSelectAllRow = (selected, selectedRows) => {
      state.selectedRowKeys = tableData.value.map((e) => e.id);
      state.selectedRows = selectedRows;
    };

    const isActiveArray = ref([]);

    const filter = () => {
      // 從 workspaceTags 篩選 isActive = true 的 workspaceId
      isActiveArray.value = workspaceTags.value
        .filter((tag) => tag.isActive)
        .map((e) => e.workspaceId);

      // 從 tableData 篩選與 isActiveArray 含有相同 workspaceId 的資料
      filterData.value = tableData.value.filter((item) =>
        isActiveArray.value.includes(item.workspaceId)
      );
    };

    const switchStatus = (tag) => {
      tag.isActive = !tag.isActive;
      filter();
    };

    return {
      columns,
      tableData,
      hideTrash,
      deletePermanently,
      getRecyclingBinItemName,
      formatDate,
      restoreData,
      isShowLoading,
      activeKey,
      beforeDeletePermanently,
      isShowBeforeDeleteDialog,
      deleteData,
      closeBeforeDeleteDialog,
      onSelectAllRow,
      workspaceTags,
      switchStatus,
      filterData,
      onSelectChange,
      state,
      checkDeleteType,
    };
  },
};
</script>
<style lang="scss" scoped>
.trash-wrapper {
  position: fixed;
  top: 0;
  // bottom: -100%;
  z-index: 100;
  width: 100%;
  height: 100%;
  background-color: $primary-white;
  // box-shadow: 0 -5px 10px -3px $primary-dark-grey;
  // opacity: 0;
}

.trash-container {
  position: relative;
  max-width: 1440px;
  height: 100%;
  margin: auto;
  padding: 20px 10px;
}

.header {
  padding-top: 20px;

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    cursor: pointer;

    &:hover {
      .header {
        &__back-icon {
          // background-position-y: center;
          background-repeat: no-repeat;
          background-image: url("~@/assets/img/login/icon-left-hover.png");
        }
      }
    }
  }

  &__back-icon {
    width: 20px;
    height: 20px;
    display: block;
    // margin-right: 5px;
    // background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/login/icon-left.png");
  }

  &__back-text {
    color: $primary-dark-grey;
    font-size: 14px;
    font-weight: bold;
  }

  &__title {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
      font-size: 22px;
      color: $primary-black;
      font-weight: bold;
    }

    a {
      padding: 8px;
      border: 1px solid #666666;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  &__description {
    margin-bottom: 30px;
    color: $primary-dark-grey;
  }
}

.table-btn {
  display: flex;
  gap: 10px;
  align-items: center;
  // justify-content: flex-end;

  .anticon {
    display: block;
    font-size: 18px;
    color: $primary-dark-grey;
  }
}

.table-group {
  height: calc(100% - 120px);
  overflow-y: scroll;

  &__item {
    &:not(:last-child) {
      // margin-bottom: 40px;
      padding-bottom: 10px;
      border-bottom: unset;
    }
  }

  &__item-name {
    display: block;
    margin-bottom: 12px;
    font-size: 20px;
    font-weight: 700;
  }

  &--empty {
    position: relative;
    top: 18%;

    .empty-image {
      margin: auto auto 10px;
      display: block;
      width: 140px;
    }

    .empty-desc {
      text-align: center;

      &__item {
        font-size: 14px;

        &--bold {
          margin-bottom: 8px;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

.table-group-container {
  background-color: unset;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;

  &__item {
    padding: 4px 16px;
    color: $primary-dark-grey;
    border: 1px solid $primary-dark-grey;
    border-radius: 50px;
    cursor: pointer;

    &--active {
      color: $primary-blue;
      border-color: $primary-blue;
    }
  }
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  color: #666666;
  font-size: 14px;

  &::before {
    width: 0 !important;
  }
}

:deep(.ant-table-thead) {
  background-color: #f2f2f2;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  padding: 6px 16px;
}

.editable-cell {
  p {
    color: #333;
  }
}

:deep(.ant-btn) {
  padding: 0 8px;
}
</style>

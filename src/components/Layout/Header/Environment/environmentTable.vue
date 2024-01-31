<template>
  <div class="environment-table-wrapper">
    <div class="environment-table__header">
      <div class="environment-table__title">
        {{ environmentInfo.id === -1 ? "Environment" : environmentInfo.name }}
      </div>
      <div class="environment-table__actions" v-if="isEditable">
        <a
          v-if="environmentInfo.id !== -1"
          @click="openEditPage(environmentInfo)"
          >Edit</a
        >
      </div>
    </div>
    <div class="empty-block" v-if="filterData && !filterData.length">
      <div class="empty-block__content">
        <div class="empty-block__title">
          {{
            environmentInfo.id === -1
              ? "No active Environment"
              : "No Environment variables"
          }}
        </div>
        <div class="empty-block__message">
          An environment is a set of variables that allow you to switch the
          context of your requests.
        </div>
      </div>
    </div>
    <a-table
      v-else
      :columns="columns"
      :data-source="filterData"
      bordered
      :pagination="false"
      :rowKey="(record) => record.id"
      class="environment-table"
      :scroll="{ y: 200 }"
    >
      <template #bodyCell="{ column, record }">
        <div class="editable-cell">
          <div
            v-if="
              record === stateData.selectedRecord &&
              column.key === stateData.selectedCol
            "
            class="editable-cell-input-wrapper"
          >
            <a-input
              v-model:value="record[column.key]"
              @pressEnter="onBlur(record)"
              ref="editInput"
              @blur="onBlur(record)"
              :placeholder="`${column.dataIndex}`"
            />
          </div>
          <div v-else class="editable-cell-text-wrapper">
            <p>
              {{ record[column.key] ? record[column.key] : column.dataIndex }}
            </p>
            <p v-if="column.key === 'value' && isEditable">
              <edit-outlined
                class="editable-cell-icon"
                @click="editValue(record, column.key)"
              />
            </p>
          </div>
        </div>
      </template>
    </a-table>
  </div>
</template>
<script>
import { watch, toRefs, computed, reactive, ref, inject, nextTick } from "vue";
import workspaceData from "@/store/workspace";
import { editEnvironment } from "@/js/ipc/environmentIPC.js";
import tabsData from "@/store/tabs";
import { useStore } from "vuex";
import Helper from "@/js/utils/helper";
import _ from "lodash-es";

export default {
  props: {
    environmentInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "close-popover": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const store = useStore();
    const { environmentInfo } = toRefs(props);
    const columns = [
      {
        title: "VARIABLE",
        dataIndex: "key",
        key: "key",
        width: 50,
      },
      {
        title: "VALUE",
        key: "value",
        dataIndex: "value",
        width: 50,
      },
    ];

    const filterData = computed(() =>
      environmentInfo.value.variable.filter((e) => !e.disabled)
    );

    const editInput = ref("");

    const stateData = reactive({
      selectedCol: "",
      selectedRecord: "",
    });

    const editValue = (record, col) => {
      stateData.selectedCol = col;
      stateData.selectedRecord = record;

      nextTick(() => {
        editInput.value.focus();
      });
    };

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const updateEnvironmentData = async () => {
      const obj = {
        environmentId: environmentInfo.value.id,
        workspaceId: currentWorkspace.value.id,
        variable: environmentInfo.value.variable,
      };

      const formatObj = JSON.parse(JSON.stringify(obj));

      const res = await editEnvironment(formatObj);
      if (res.code === 20000) {
        environmentInfo.value.tabKey = environmentInfo.value.id;
        store.commit("UPDATE_TAB", environmentInfo.value);
        workspaceData.reloadVariables();
      }
    };

    const onBlur = (record) => {
      updateEnvironmentData();
      stateData.selectedCol = undefined;
      stateData.selectedRecord = undefined;
    };

    const openEditPage = (data) => {
      data.tabType = "environment";
      data.tabKey = data.id;
      $bus.emit("handleTabAddAndFocused", data);
      context.emit("close-popover");
    };

    watch(environmentInfo, (val) => {
      if (
        environmentInfo.value.variable &&
        environmentInfo.value.variable.length > 0
      ) {
        // environmentInfo.value.variable.forEach((e) => {
        //   e.id = Helper.generateHashKey(5);
        // });
        // tabsData.initElementId1(
        Helper.initElementIdByIndex(
          environmentInfo.value.variable,
          "environment"
        );
      }
    });

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    return {
      columns,
      tabsData,
      openEditPage,
      filterData,
      editValue,
      editInput,
      stateData,
      onBlur,
      isEditable,
    };
  },
};
</script>
<style lang="scss" scoped>
.environment-table {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background-color: #f0f0f0;
  }

  &__actions {
    a {
      color: $link-blue;
      font-weight: 600;
    }
  }

  &__title {
    max-width: 90%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &:deep(.ant-table-row) {
    .editable-cell-icon {
      display: none;
      cursor: pointer;
    }

    &:hover {
      .editable-cell-icon {
        display: inline-block;
      }
    }
  }
}

.empty-block {
  text-align: center;

  &__content {
    padding: 16px 0;
  }

  &__title {
    margin-bottom: 16px;
    color: #333;
    font-weight: 600;
  }
}

.editable-cell-text-wrapper {
  display: flex;
  align-content: center;
  justify-content: space-between;

  p {
    max-width: 80%;
    margin-bottom: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .editable-cell-icon {
    height: 100%;
  }
}

.editable-cell-input-wrapper {
  height: 22px;

  .ant-input {
    height: 100%;
  }
}
</style>

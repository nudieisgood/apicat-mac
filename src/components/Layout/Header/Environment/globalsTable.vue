<template>
  <div class="globals-table-wrapper">
    <div class="globals-table__header">
      <div class="globals-table__title">Globals</div>
      <div class="globals-table__actions" v-if="isEditable">
        <a
          v-if="globalsInfo.variable && !globalsInfo.variable.length"
          @click="addGlobals"
          >Add</a
        >
        <a v-else @click="openEditPage(globalsInfo)">Edit</a>
      </div>
    </div>
    <div class="empty-block" v-if="filterData && !filterData.length">
      <div class="empty-block__content">
        <div class="empty-block__title">No global variables</div>
        <div class="empty-block__message">
          Global variables are a set of variables that are always available in a
          workspace.
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
      class="globals-table"
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
import { watch, toRefs, computed, reactive, ref, nextTick, inject } from "vue";
import workspaceData from "@/store/workspace";
import tabsData from "@/store/tabs";
import { editWorkspace } from "@/js/ipc/workspaceIPC.js";
import { useStore } from "vuex";
import Helper from "@/js/utils/helper";

export default {
  props: {
    globalsInfo: {
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
    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const { globalsInfo } = toRefs(props);
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
    const editInput = ref();

    const stateData = reactive({
      selectedCol: "",
      selectedRecord: "",
    });

    const editValue = (record, col) => {
      stateData.selectedRecord = record;
      stateData.selectedCol = col;

      nextTick(() => {
        editInput.value.focus();
      });
    };

    const onBlur = (record) => {
      updateWorkspaceData();
      stateData.selectedCol = undefined;
      stateData.selectedRecord = undefined;
    };

    const updateWorkspaceData = async () => {
      const obj = {
        workspaceId: currentWorkspace.value.id,
        variable: globalsInfo.value.variable,
      };
      const formatObj = JSON.parse(JSON.stringify(obj));

      const res = await editWorkspace(formatObj);
      if (res.code === 20000) {
        globalsInfo.value.tabKey = globalsInfo.value.id;
        globalsInfo.value.tabType = "globals";
        store.commit("UPDATE_TAB", globalsInfo.value);
        workspaceData.reloadVariables();
      }
    };

    const filterData = computed(() =>
      globalsInfo.value.variable.filter((e) => !e.disabled)
    );

    const addGlobals = () => {
      const obj = {};
      Object.assign(obj, currentWorkspace.value);
      obj.tabType = "globals";
      obj.workspaceId = currentWorkspace.value.id;
      $bus.emit("handleTabAddAndFocused", obj);
      context.emit("close-popover");
    };

    const openEditPage = (data) => {
      data.tabType = "globals";
      data.tabKey = data.id;
      $bus.emit("handleTabAddAndFocused", data);
      context.emit("close-popover");
    };

    watch(
      globalsInfo,
      (val) => {
        if (!globalsInfo.value.variable) {
          globalsInfo.value.variable = [];
        }

        if (
          globalsInfo.value.variable &&
          globalsInfo.value.variable.length > 0
        ) {
          // globalsInfo.value.variable.forEach((e) => {
          //   e.id = Helper.generateHashKey(5);
          // });
          Helper.initElementIdByIndex(globalsInfo.value.variable, "global");
        }
      },
      {
        immediate: true,
      }
    );

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    return {
      columns,
      addGlobals,
      tabsData,
      filterData,
      openEditPage,
      editValue,
      editInput,
      stateData,
      onBlur,
      updateWorkspaceData,
      isEditable,
    };
  },
};
</script>
<style lang="scss" scoped>
.globals-table {
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

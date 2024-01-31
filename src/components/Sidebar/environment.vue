<template>
  <div class="environment-list-wrapper">
    <div class="environment-list-operation">
      <action-menu
        @create="addEnvironment"
        @search="onSearch"
        :current-tab-name="'Environments'"
      />
    </div>

    <div class="environment-list">
      <div class="environment-list-row">
        <li
          class="environment-list__item environment-list__item--global"
          :class="{
            'environment-list__item--is-selected':
              globalInfo.id === selectedEnvironmentInfo.id,
          }"
          @click="handleItem(globalInfo)"
        >
          <span class="environment-list__item-name">Globals</span>
        </li>
      </div>
      <div
        class="environment-list-row"
        v-if="environmentList && environmentList.length > 0"
      >
        <li
          class="environment-list__item environment-list__item--environment"
          v-for="environment in environmentList"
          :key="environment.id"
          @click="handleItem(environment)"
          :class="{
            'environment-list__item--is-selected':
              environment.id === selectedEnvironmentInfo.id,
          }"
        >
          <div class="environment-list__item-left">
            <a-input
              v-if="isShowRenameInput && environment.id === selectedId"
              v-model:value="environment.name"
              @blur="onBlur(environment)"
              class="edit-input"
              ref="editInput"
              @keyup.enter="onBlur(environment)"
              v-focus
              @click.stop
            />
            <span v-else class="environment-list__item-name">{{
              environment.name
            }}</span>
          </div>
          <div class="environment-list__item-right" @click.stop>
            <div
              class="environment-list__item-right__check-icon"
              @click.stop="selectEnvironment(environment.id)"
            >
              <check-circle-filled v-if="environment.isSelected" />
              <check-circle-outlined v-else />
            </div>
            <a-popover
              trigger="click"
              :getPopupContainer="(trigger) => trigger.parentNode"
              placement="bottomRight"
              :open="environment.id === selectedId && actionsVisible"
              overlayClassName="action-list-overlay"
            >
              <template #content>
                <ul class="action-list">
                  <li>
                    <a
                      class="actions-item actions-item--rename"
                      @click="
                        (isShowRenameInput = true), (actionsVisible = false)
                      "
                      >Rename<span class="hot-key">Ctrl+E</span></a
                    >
                  </li>
                  <li @click="openTipDialog(environment)">
                    <a class="actions-item actions-item--delete"
                      >Delete<span class="hot-key">Del</span></a
                    >
                  </li>
                </ul>
              </template>
              <span
                v-if="isEditable"
                class="btn-popup"
                @click="openList(environment)"
                v-click-outside="() => (actionsVisible = false)"
                ><bars-outlined
              /></span>
            </a-popover>
          </div>
        </li>
      </div>
      <div class="empty-block-wrapper" v-else>
        <div class="empty-block">
          <p v-if="showTip" class="tip-text">No results found</p>
          <div v-else class="empty-block__header">No Environment</div>
        </div>
      </div>
    </div>
  </div>

  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="hideTipDialog"
    :deleted-data="selectedEnvironmentInfo"
    @reset-deleted-data="resetDeletedData"
  />
</template>

<script>
import { ref, watch, computed, inject } from "vue";
import TipDialog from "@/components/TipDialog";
import { createEnvironment } from "@/js/ipc/environmentIPC.js";
import { useStore } from "vuex";
import tabsData from "@/store/tabs";
import ActionMenu from "@/components/Sidebar/actionMenu.vue";
import Helper from "@/js/utils/helper";

const focus = {
  mounted(el) {
    el.focus();
  },
};

export default {
  components: {
    TipDialog,
    ActionMenu,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const store = useStore();

    const workspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    // create env
    const addEnvironment = Helper.throttle(async () => {
      const createData = {
        workspaceId: workspace.value.id,
        environmentName: "New Environment",
        variable: [],
      };
      const res = await createEnvironment(createData);
      if (res.code === 20000) {
        const obj = {};
        Object.assign(obj, res.data);
        obj.tabKey = res.data.id;
        obj.tabType = "environment";
        $bus.emit("handleTabAddAndFocused", obj);
        selectedEnvironmentInfo.value = obj;
        selectedId.value = obj.id;
      }
    });

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    // rename
    const isShowRenameInput = ref(false);
    const editInput = ref();
    const onBlur = async (data) => {
      let res = {};
      res = await tabsData.editSidebarItemName(data);
      if (res.code === 20000) {
        const pane = tabsPane.value.find((tab) => tab.id === data.id);
        if (pane) {
          pane.name = res.data.name;
          store.commit("UPDATE_TAB", pane);
        }
      }
      isShowRenameInput.value = false;
      // $bus.emit('changeEnvironment', data.id)
    };

    // delete
    const selectedId = ref(null);
    const actionsVisible = ref(false);
    const isShowTipDialog = ref(false);
    const selectedEnvironmentInfo = ref({});

    const openList = (data) => {
      selectedId.value = data.id;
      selectedEnvironmentInfo.value = data;
      actionsVisible.value = true;
      document.onkeydown = keyFunc;
    };

    const openTipDialog = (environment) => {
      if (JSON.stringify(environment) === "{}") {
        return;
      }
      selectedEnvironmentInfo.value = environment;
      isShowTipDialog.value = true;
      actionsVisible.value = false;
    };
    const hideTipDialog = () => {
      isShowTipDialog.value = false;
    };

    const handleItem = (data) => {
      selectedId.value = data.id;
      selectedEnvironmentInfo.value = data;
      $bus.emit("handleTabAddAndFocused", data);
      document.onkeydown = keyFunc;
    };

    const onClickOutside = (event) => {
      actionsVisible.value = false;
    };

    const environmentList = ref([]);
    const originalEnvironmentList = ref([]);
    const envId = computed(() => {
      return store.getters.getSelectedEnvironmentId;
    });

    watch(
      () => store.getters.getEnvironmentList,
      (newVal, oldVal) => {
        if (!store.getters.getEnvironmentList.length) {
          environmentList.value = [];
        } else {
          environmentList.value = store.getters.getEnvironmentList;
          environmentList.value.forEach((env) => {
            env.tabType = "environment";
            env.tabKey = env.id;
            if (env.id === envId.value) {
              env.isSelected = true;
            } else {
              env.isSelected = false;
            }
          });

          originalEnvironmentList.value = JSON.parse(
            JSON.stringify(environmentList.value)
          );
        }
      },
      {
        immediate: true,
        // deep: true
      }
    );

    watch(
      envId,
      () => {
        environmentList.value.forEach((env) => {
          if (env.id === envId.value) {
            env.isSelected = true;
          } else {
            env.isSelected = false;
          }
        });
      },
      {
        immediate: true,
      }
    );

    const selectEnvironment = (selectedId) => {
      environmentList.value.forEach((env) => {
        if (env.id === selectedId) {
          env.isSelected = true;
        } else {
          env.isSelected = false;
        }
      });

      store.commit("SET_ENVIRONMENT_ID", selectedId);
      actionsVisible.value = false;
    };

    const globalInfo = ref({});

    watch(
      () => workspace,
      () => {
        globalInfo.value = workspace.value;
        globalInfo.value.tabType = "globals";
        globalInfo.value.tabKey = globalInfo.value.id;
      },
      {
        immediate: true,
      }
    );
    const isSearch = ref(false);
    const showTip = ref(false);

    const onSearch = (value) => {
      if (!value) {
        environmentList.value = originalEnvironmentList.value;
        return;
      }
      isSearch.value = true;
      environmentList.value = originalEnvironmentList.value;
      const fileterData = environmentList.value.filter((e) => {
        return e.name.indexOf(value) > -1;
      });
      environmentList.value = fileterData;
      if (environmentList.value.length === 0) {
        showTip.value = true;
      } else {
        showTip.value = false;
      }
    };

    const keyFunc = () => {
      if (event.keyCode === 69 && event.ctrlKey) {
        // show rename input by "ctrl + E"
        event.preventDefault();
        isShowRenameInput.value = true;
        onClickOutside();
      } else if (event.keyCode === 46) {
        // del by "Delete"
        if (isShowRenameInput.value) {
          return;
        }
        event.preventDefault();
        openTipDialog(selectedEnvironmentInfo.value);
        onClickOutside();
      }
    };

    const resetDeletedData = () => {
      selectedEnvironmentInfo.value = {};
    };

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    return {
      selectedId,
      actionsVisible,
      onClickOutside,
      openList,
      isShowTipDialog,
      openTipDialog,
      hideTipDialog,
      selectedEnvironmentInfo,
      isSearch,
      showTip,
      addEnvironment,
      environmentList,
      selectEnvironment,
      isShowRenameInput,
      editInput,
      onBlur,
      handleItem,
      globalInfo,
      onSearch,
      resetDeletedData,
      isEditable,
    };
  },
  directives: {
    focus,
  },
};
</script>
<style lang="scss" scoped>
$operation-height: 32px;
$operation-margin: 10px;
$sidebar-trigger-height: 40px;

.environment-list-wrapper {
  height: 100%;
  padding-left: 8px;
  outline: none;
}

.environment-list-header {
  margin: 10px 0;
  color: rgb(107, 107, 107);
  font-weight: 500;
}

.environment-list-operation {
  display: flex;
  align-items: center;
  // margin-top: 20px;
  margin-bottom: 10px;
}

.environment-list {
  height: calc(100% - #{$operation-height} - #{$operation-margin});
  overflow: auto;

  &__item {
    // margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &--global {
      margin: 0 0 8px;
      // padding: 12px 0;

      .environment-list__item-name {
        margin-left: 4px;
      }
    }

    &--environment {
      margin: 10px 0;
    }

    &:hover {
      background-color: #d9e2e5;
      cursor: pointer;
    }

    &--is-selected {
      background-color: $secondary-light-grey;
    }
  }

  &__item-name {
    width: 100%;
    display: block;
    padding: 1px 2px;
  }

  &__item-left {
    margin-left: 4px;
  }

  &__item-right {
    display: flex;
    align-items: center;
    margin-right: 4px;

    &__check-icon {
      margin-right: 8px;

      span {
        font-size: 13px;
      }
    }

    &:deep(.action-list-overlay) {
      min-width: 200px;
    }
  }
}

.environment-list-row {
  &:first-child {
    border-bottom: 1px solid #b0b0b0;
  }
}

.empty-block-wrapper {
  position: relative;
  width: 100%;
  height: calc(100% - #{$operation-height} - #{$operation-margin});
}

.empty-block {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  text-align: center;
  transform: translate(-50%, -50%);

  &__header {
    // margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
  }
}

.ant-dropdown-menu-title-content {
  a {
    font-weight: 500;
    font-size: 13px;
    color: #333;
    line-height: 16px;
  }
}

.actions {
  margin-left: auto;

  &__item {
    margin-left: 5px;
    padding: 3px;
    cursor: pointer;
  }
}

.tip-text {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.action-list {
  margin-bottom: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 4px 0;
    height: 32px;
    line-height: 32px;
    cursor: pointer;
  }
}

.actions-item {
  display: flex;
  color: #333;

  &--delete {
    color: #ff5151;
  }
}

.edit-input {
  height: 100%;
  padding: 1px 10px;
  // padding: 4px 11px 6px;
  line-height: unset;
}

.hot-key {
  margin-left: auto;
  color: #767676;
}
</style>

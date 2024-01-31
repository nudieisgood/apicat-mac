<template>
  <div class="header-wrapper">
    <div class="workspace-block">
      <div class="workspace-block__workspace-btn">
        <Workspace />
      </div>
      <div class="workspace-block__workspace-name">
        <p v-if="currentWorkspace.name" @click="openWorkspacePage">
          {{ currentWorkspace.name }}
        </p>
        <p v-else>No workspace</p>
      </div>
    </div>
    <div class="btn-new-wrapper" v-if="!isOnCollapse && currentWorkspace.id">
      <div class="btn-new" @click="isShowCreateDialog = true">
        <span class="icon-add" />
        <span class="">New</span>
      </div>
    </div>
    <div class="operation-list">
      <div class="operation-list__item operation-list__item-environment">
        <div class="environment-block">
          <div class="environment-block__selector">
            <a-select
              v-model:value="selectedEnvironmentId"
              placeholder="Select an environment"
              style="width: 200px"
              @change="changeEnvironment"
            >
              <a-select-option
                :key="defaultOption.id"
                :label="defaultOption.name"
                :value="defaultOption.id"
                >{{ defaultOption.name }}</a-select-option
              >
              <a-select-option
                v-for="(option, index) in environmentList"
                :key="index"
                :label="option.name"
                :value="option.id"
                >{{ option.name }}</a-select-option
              >
            </a-select>
          </div>
          <div class="environment-block__action-icon">
            <a-popover
              placement="bottomRight"
              trigger="click"
              overlayClassName="environment-popover-wrapper"
              :getPopupContainer="(trigger) => trigger.parentNode"
              :open="isVisible"
              @openChange="onVisibleChange"
            >
              <template #content>
                <div class="environment-popover-container">
                  <div class="environment-popover-block">
                    <environment-table
                      :environment-info="selectedEnvironmentInfo"
                      @close-popover="isVisible = false"
                    />
                  </div>
                  <div class="environment-popover-block">
                    <globals-table
                      :globals-info="currentWorkspace"
                      @close-popover="isVisible = false"
                    />
                  </div>
                </div>
              </template>
              <a class="environment-preview-icon">
                <img
                  :src="require('@/assets/img/header/icon-eye.png')"
                  alt="not-hover-icon"
                  class="environment-preview-icon--not-hover"
                />
                <img
                  :src="require('@/assets/img/header/icon-eye-hover.png')"
                  alt="hover-icon"
                  class="environment-preview-icon--hover"
                />
              </a>
            </a-popover>
            <a
              class="environment-add-icon"
              @click="addEnvironment"
              v-if="isEditable"
            >
              <img
                :src="require('@/assets/img/header/icon-add.png')"
                alt="not-hover-icon"
                class="environment-add-icon--not-hover" />
              <img
                :src="require('@/assets/img/header/icon-add-hover.png')"
                alt="hover-icon"
                class="environment-add-icon--hover"
            /></a>
          </div>
        </div>
      </div>
      <div class="operation-list__item operation-list__item-user">
        <user />
      </div>
    </div>
  </div>
  <create-new-dialog
    v-if="isShowCreateDialog"
    :dialogVisible="isShowCreateDialog"
    @close-create-dialog="isShowCreateDialog = !isShowCreateDialog"
  />
</template>
<script>
import {
  ref,
  watch,
  onBeforeUnmount,
  onMounted,
  computed,
  nextTick,
  inject,
} from "vue";
import GlobalsTable from "@/components/Layout/Header/Environment/globalsTable.vue";
import EnvironmentTable from "@/components/Layout/Header/Environment/environmentTable.vue";
import User from "@/components/Layout/Header/User";
import Workspace from "@/components/Layout/Header/Workspace";
import { createEnvironment } from "@/js/ipc/environmentIPC.js";
import { useStore } from "vuex";
import TypeEnum from "@/js/enum/typeEnum";
import CreateNewDialog from "@/components/Layout/Header/CreateNewDialog";
import Helper from "@/js/utils/helper";

export default {
  name: "Header",
  components: {
    GlobalsTable,
    EnvironmentTable,
    User,
    Workspace,
    CreateNewDialog,
  },
  setup() {
    const $bus = inject("$bus");
    const store = useStore();
    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const environmentList = computed(() => {
      return store.getters.getEnvironmentList;
    });

    const isOnCollapse = computed(() => {
      return store.getters.isOnCollapse;
    });

    const openWorkspacePage = () => {
      const obj = {};
      Object.assign(obj, currentWorkspace.value);
      obj.tabType = TypeEnum.workspace.name;
      obj.tabKey = currentWorkspace.value.id;
      $bus.emit("handleTabAddAndFocused", obj);
    };

    const defaultOption = ref({
      id: -1,
      value: "No environment",
      name: "No environment",
      variable: [],
      workspaceId: currentWorkspace.value.id,
    });

    const selectedEnvironmentId = ref(-1);
    const selectedEnvironmentInfo = ref({});
    const changeEnvironment = (selectedId) => {
      selectedEnvironmentId.value = selectedId;
      const found = environmentList.value.find((e) => e.id === selectedId);
      selectedEnvironmentInfo.value = found || defaultOption.value;

      setTimeout(() => {
        store.commit("SET_ENVIRONMENT_ID", selectedEnvironmentId.value);
      }, 500);
    };

    const selectorBlur = () => {
      // 透過 blur 更新 store 的資料，若再選擇的當下更新，會造成卡頓
      store.commit("SET_ENVIRONMENT_ID", selectedEnvironmentId.value);
    };

    const isVisible = ref(false);

    const onVisibleChange = (trigger) => {
      // 打開右上方變數選單時，需先確認環境變數是否有更新
      const found = environmentList.value.find(
        (e) => e.id === selectedEnvironmentInfo.value.id
      );
      selectedEnvironmentInfo.value = found || defaultOption.value;


      // isVisible.value = trigger;
      nextTick(() => {
        isVisible.value = trigger;
      });

      
    };

    const addEnvironment = Helper.throttle(async () => {
      const createData = {
        workspaceId: currentWorkspace.value.id,
        environmentName: "New Environment",
        variable: [],
      };
      const res = await createEnvironment(createData);
      if (res.code === 20000) {
        const obj = {};
        Object.assign(obj, res.data);
        obj.tabType = "environment";
        obj.tabKey = obj.id;
        // handleTabAddAndFocused(obj)
        $bus.emit("handleTabAddAndFocused", obj);
      }
    });

    // 建立空白項目相關參數及func
    const isShowCreateDialog = ref(false);

    const openCreateDialog = () => {
      isShowCreateDialog.value = true;
    };

    // 透過 ctrl+N 開啟建立空白項目彈窗
    const openCreateNewByKeydown = (e) => {
      if (e.keyCode === 78 && e.ctrlKey) {
        e.preventDefault();
        openCreateDialog();
      }
    };

    const setLastEnvironmentId = () => {
      // 登入後，預設帶 -1
      // 切換工作區後，若該工作區有記錄前次選擇的環境 id，則帶入
      return store.getters.getSelectedWorkspaceId
        ? store.getters.getSelectedEnvironmentId
          ? changeEnvironment(store.getters.getSelectedEnvironmentId)
          : changeEnvironment(-1)
        : changeEnvironment(-1);
    };

    watch(
      () => store.getters.getSelectedWorkspaceId,
      (newVal, oldVal) => {
        setLastEnvironmentId();
      }
    );

    watch(
      () => store.getters.getSelectedEnvironmentId,
      (newVal, oldVal) => {
        // 因切換工作區時會執行讀取前一筆選中的環境作為預設(會觸發changeEnvironment)，所以不再執行一次；這裡是監聽當前工作區下，由 sidebar 做環境切換
        if (!store.getters.getSelectedEnvironmentId) return;
        if (
          store.getters.getSelectedEnvironmentId === selectedEnvironmentId.value
        )
          return;

        changeEnvironment(store.getters.getSelectedEnvironmentId);
      }
    );

    onMounted(() => {
      window.addEventListener("keydown", openCreateNewByKeydown);
      setLastEnvironmentId();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", openCreateNewByKeydown);
    });

    return {
      openWorkspacePage,
      defaultOption,
      selectedEnvironmentInfo,
      changeEnvironment,
      isVisible,
      onVisibleChange,
      addEnvironment,
      isShowCreateDialog,
      openCreateDialog,
      isEditable,
      currentWorkspace,
      environmentList,
      isOnCollapse,
      selectedEnvironmentId,
      selectorBlur,
    };
  },
};
</script>
<style scoped lang="scss">
.header-wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  // justify-content: space-between;
}

.workspace-block {
  display: flex;
  align-items: center;
  width: 400px;
  margin-right: 10px;

  &__workspace-btn {
    // height: 100%;
    // padding: 5px 0;
    padding: 0 18px;
    border-right: 1px solid $primary-dark-grey;
    cursor: pointer;

    &:deep(.ant-dropdown-trigger) {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 10.5px;
      color: $primary-dark-grey;

      .anticon {
        font-size: $icon-size;
      }

      &:hover {
        color: $primary-blue;
      }
    }

    &:hover {
      border-right-color: $primary-blue;
    }
  }

  &__workspace-name {
    // margin-left: 20px;
    padding-right: 8px;
    padding-left: 12px;
    color: $primary-dark-grey;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;

    p {
      font-size: 20px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &:hover {
      color: $primary-blue;
    }
  }
}

.environment-block {
  // position: absolute;
  // top: 0;
  // right: 0;
  display: flex;
  align-items: center;

  &__selector {
    &:deep(.ant-select-selection-item) {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      display: block;
      font-size: $text-size-s;
    }
  }

  &__action-icon {
    display: flex;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;

    a {
      margin: 0 10px;
    }
  }
}

.environment-preview-icon {
  position: relative;
  width: 20px;
  height: 20px;
  display: block;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }

  &--not-hover {
    opacity: 1;
  }

  &--hover {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  &:hover {
    .environment-preview-icon--not-hover {
      opacity: 0;
    }

    .environment-preview-icon--hover {
      opacity: 1;
    }
  }
}

.environment-add-icon {
  position: relative;
  width: 22px;
  height: 22px;
  display: block;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }

  &--not-hover {
    opacity: 1;
  }

  &--hover {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  &:hover {
    .environment-add-icon--not-hover {
      opacity: 0;
    }

    .environment-add-icon--hover {
      opacity: 1;
    }
  }
}

.operation-list {
  // height: 100%;
  display: flex;
  align-items: center;
  margin-left: auto;

  &__item-user {
    cursor: pointer;
  }
}

.btn-new {
  padding: 2px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid $primary-dark-grey;
  color: $primary-dark-grey;
  cursor: pointer;

  &:hover {
    color: $primary-blue;
    border-color: $primary-blue;

    .icon-add {
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/header/icon-add-hover.png");
    }
  }
}

.icon-add {
  margin-right: 4px;
  width: 18px;
  height: 18px;
  display: block;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("~@/assets/img/header/icon-add.png");
}
</style>

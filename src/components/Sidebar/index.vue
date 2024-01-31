<template>
  <div class="empty-block" v-if="!workspace.id">
    <div class="empty-block__text">
      Creating a workspace to organize and work together on API projects with
      your team right now.
    </div>
  </div>
  <a-layout-sider
    v-model:collapsed="collapsed"
    collapsible
    collapsed-width="88"
    :width="currentWidth"
    @collapse="onCollapse"
    :trigger="null"
    ref="layoutSider"
    v-else
  >
    <Tabs
      :is-collapsed="collapsed"
      @update-collapsed="updateCollapsed"
      :real-width="realWidth"
      @on-collapse="collapse"
    />
  </a-layout-sider>
  <run-in-okman-dialog
    v-if="showImportHtml"
    :dialogVisible="showImportHtml"
    @close-import-dialog="showImportHtml = !showImportHtml"
    :workspaceList="workspaceList"
    @import-html="importHtml"
  />
  <create-new-dialog
    v-if="isShowCreateDialog"
    :dialogVisible="isShowCreateDialog"
    @close-create-dialog="isShowCreateDialog = !isShowCreateDialog"
  />
</template>
<script>
import {
  ref,
  getCurrentInstance,
  watch,
  toRefs,
  onBeforeUnmount,
  nextTick,
  onMounted,
  computed,
  inject,
} from "vue";
import Tabs from "@/components/Sidebar/tabs.vue";
import RunInOkmanDialog from "@/components/Layout/Header/Workspace/runInOkmanDialog.vue";
import TypeEnum from "@/js/enum/typeEnum";
import CreateNewDialog from "@/components/CreateNewDialog";
import store from "@/store";

export default {
  components: {
    Tabs,
    RunInOkmanDialog,
    CreateNewDialog,
  },
  props: {
    realWidth: {
      type: Number,
      default: 400,
    },
  },
  emits: {
    "update-sidebar-width": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const { realWidth } = toRefs(props);
    const collapsed = ref(false);
    const currentWidth = ref(null);
    const onCollapse = (isCollapsed, type) => {
      collapsed.value = isCollapsed;
      store.commit("SET_SIDEBAR_MODE", isCollapsed);
    };

    const showImport = ref(false);

    const updateCollapsed = () => {
      collapsed.value = false;
    };

    const showImportHtml = ref(false);
    const workspaceList = ref([]);
    const ipcEvent = ref(null);

    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    ipcRenderer.on("select-workspace", (event, arg) => {
      ipcEvent.value = event;
      workspaceList.value = arg;
      showImportHtml.value = true;
    });

    const importHtml = (workspaceId) => {
      ipcEvent.value.sender.send("select-workspace-cb", workspaceId);
    };
    const app = getCurrentInstance();

    const workspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const openWorkspacePage = () => {
      const obj = {};
      Object.assign(obj, workspace.value);
      obj.tabType = TypeEnum.workspace.name;
      $bus.emit("handleTabAddAndFocused", obj);
    };

    if (app) {
      $bus.on("onCollapse", (isCollapsed) => {
        onCollapse(isCollapsed);
      });
    }

    watch(
      collapsed,
      (val) => {
        if (!val) {
          currentWidth.value = 400;
        } else {
          currentWidth.value = 88;
        }
        context.emit("update-sidebar-width", currentWidth.value);
      },
      {
        immediate: true,
      }
    );

    watch(
      realWidth,
      (val) => {
        currentWidth.value = realWidth.value;
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      $bus.off("onCollapse");
    });

    const isShowCreateDialog = ref(false);

    const layoutSider = ref();

    const collapse = () => {
      layoutSider.value.onCollapse(!collapsed.value);
      store.commit("SET_SIDEBAR_MODE", collapsed.value);
    };

    onMounted(() => {
      nextTick(() => {});
    });

    return {
      collapsed,
      onCollapse,
      updateCollapsed,
      showImport,
      showImportHtml,
      workspaceList,
      importHtml,
      openWorkspacePage,
      currentWidth,
      isShowCreateDialog,
      layoutSider,
      collapse,
      workspace,
    };
  },
};
</script>
<style lang="scss" scoped>
$sidebar-trigger-height: 48px;
$user-wrapper-height: 72px;

.ant-layout-sider {
  width: 100%;
  height: 100%;
  background: transparent;
  // transition: unset;
}

.ant-layout-sider-has-trigger {
  padding-bottom: 0;
}

:deep(.ant-layout-sider-trigger) {
  position: relative;
  padding-bottom: 0;
  background: #343434;
  // background: #30505B;
  // transition: unset;
}

.sidebar-header {
  height: 0;
  // margin-bottom: 8px;
  opacity: 0;
  transition: all ease-in 0.1s;

  &__active-workspace-name {
    display: flex;
    align-items: center;
    padding: 10px;
    //height: 45px;
    border-bottom: 1px solid #d5d5d5;

    p {
      width: 70%;
      margin-left: 10px;
      margin-bottom: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    &:deep(.anticon-user) {
      margin-right: 8px;
    }
  }

  &__btn-import {
    margin-left: auto;
    padding: 3px 8px;
    height: unset;
    color: #625c5c;
    font-weight: 600;
    line-height: unset;
    border: none;
    background: #ffcc3394;

    &:hover,
    &:focus {
      color: unset;
      border: none;
      background: #ffcc3394;
    }
  }

  &:deep(.ant-btn) {
    font-size: $text-size-xs;

    & > span {
      font-size: $text-size-xs;
    }
  }

  &__btn-new {
    margin-right: 8px;
    margin-left: auto;
    padding: 3px 8px;
    height: unset;
    color: #625c5c;
    font-weight: 600;
    line-height: unset;
    border: none;
    background: #ffcc3394;

    &:hover,
    &:focus {
      color: unset;
      border: none;
      background: #ffcc3394;
    }
  }
}

.opacity {
  // opacity: 0;
  display: none;
}

.add-height {
  height: fit-content;
  opacity: 1;
  display: block;
}
/* <transition name="slide"> */
.slide-leave-active,
.slide-enter-active {
  transition: all 0.9s ease;
}

.slide-enter-from {
  transform: translate(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.empty-block {
  position: relative;
  width: 100%;
  height: 100%;

  &__text {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    padding: 0 20px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 2;
    color: $primary-black;
    transform: translate(-50%, -50%);
  }
}

:deep(.ant-tabs-nav) {
  border-right: 1px solid #d9d9d9;
  border-top: 1px solid #d9d9d9;
  border-radius: 0 10px 0 0;
}
</style>

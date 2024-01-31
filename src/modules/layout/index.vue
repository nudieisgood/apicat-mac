<template>
  <layout-loader v-if="isShowLayoutLoading" />
  <loading v-if="isAPIProcessing" />
  <div class="layout">
    <div class="layout-header">
      <Header />
    </div>
    <div class="layout-container">
      <div class="layout-side">
        <div class="layout-side__sidebar" ref="dragSidebar">
          <!-- resize line-->
          <div class="resize-bar" @mousedown="handleMouseDown($event)"
            :class="isDisableResize ? 'default-cursor' : 'resize-cursor'">
            <div :class="{ 'resize-bar__body': dragSidebarData.isShowResizeBar }"></div>
          </div>
          <div class="layout-side__sidebar-border-click" :style="{ width: `${dragSidebarData.realWidth}px` }"
            :class="{ 'add-transition': !dragSidebarData.isShowResizeBar }">
            <sidebar :real-width="dragSidebarData.realWidth" @update-sidebar-width="updateSidebarWidth" />
          </div>
        </div>
      </div>
      <div class="layout-container__content" :style="contentWidth" @click="deleteByKeyDown">
        <div class="layout-container__builder">
          <requester-builder />
        </div>
      </div>
    </div>
    <div class="layout-container__footer">
      <div class="data-operation">
        <div class="data-operation__item" @click="isSettingDialog = true">
          <setting-outlined />
        </div>
        <div class="data-operation__item" @click="onSync" :class="{
          'data-operation__item--on-sync': isAPIProcessing,
        }">
          <sync-outlined />
        </div>
        <div class="data-operation__item" @click="isShowLog = !isShowLog">
          <img :src="require('@/assets/img/footer/icon-command-line.png')" alt="" />
          <span class="data-operation__item-label">Console</span>
        </div>
      </div>
      <div class="operation-bar">
        <div class="operation-bar__item trash">
          <a-button @click="isShowTrashPage = true">
            <img :src="require('@/assets/img/footer/icon-delete.png')" alt="" /> Trash</a-button>
        </div>
        <div class="operation-bar__item layout" @click="changeMode">
          <a-tooltip title="Two pane view" v-if="isVerticalMode" placement="topRight">
            <div class="icon-horizontal">
              <img :src="require('@/assets/img/footer/icon-horizontal.png')" alt="not-hover-icon"
                class="icon-horizontal--not-hover" />
              <img :src="require('@/assets/img/footer/icon-horizontal-hover.png')" alt="hover-icon"
                class="icon-horizontal--hover" />
            </div>
          </a-tooltip>
          <a-tooltip title="Single pane view" v-else placement="topRight">
            <div class="icon-vertical">
              <img :src="require('@/assets/img/footer/icon-vertical.png')" alt="not-hover-icon"
                class="icon-vertical--not-hover" />
              <img :src="require('@/assets/img/footer/icon-vertical-hover.png')" alt="hover-icon"
                class="icon-vertical--hover" />
            </div>
          </a-tooltip>
        </div>
        <div class="operation-bar__item keyboard-shortcut">
          <div class="icon-keyboard" @click="isShowShortcut = true" />
        </div>
      </div>
    </div>
  </div>
  <keyboard-shortcut :show-shortcut="isShowShortcut" @hide-shortcut="isShowShortcut = false" />
  <trash-page v-if="isShowTrashPage" :is-show-trash="isShowTrashPage" @hide-trash="isShowTrashPage = false" />
  <log v-if="isShowLog" @close-log="isShowLog = false" />
  <setting-dialog v-if="isSettingDialog" :dialog-visible="isSettingDialog"
    @close-setting-dialog="isSettingDialog = false" />
  <confirm-invitation-dialog v-if="isShowConfirmInvitationDialog" :dialog-visible="isShowConfirmInvitationDialog"
    @close-dialog="isShowConfirmInvitationDialog = false" :invite-code="inviteCode" />
</template>
<script>
import {
  ref,
  reactive,
  onMounted,
  computed,
  onBeforeUnmount,
  inject,
} from "vue";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Layout/Header";
import RequesterBuilder from "@/components/RequesterBuilder";
import KeyboardShortcut from "@/components/Layout/keyboardShortcut";
import LayoutLoader from "@/components/Loader/layoutLoader";
import TrashPage from "@/components/Layout/trash";
import Loading from "@/components/Loader/loading";
import store from "@/store";
import Helper from "@/js/utils/helper";
import Log from "@/components/Layout/console";
import SettingDialog from "@/components/Layout/settingDialog";
import ConfirmInvitationDialog from "@/components/Layout/confirmInvitationDialog";

export default {
  components: {
    Sidebar,
    Header,
    RequesterBuilder,
    KeyboardShortcut,
    LayoutLoader,
    TrashPage,
    Loading,
    Log,
    SettingDialog,
    ConfirmInvitationDialog,
  },
  setup() {
    const $bus = inject("$bus");
    const $modal = inject("$modal");

    /** 可自行伸縮 sidebar 寬度 */
    const dragSidebar = ref();
    const dragSidebarData = reactive({
      currentWidth: null, // 當前容器寬度
      targetDistant: null, // 容器距離右邊寬度
      realWidth: 350, // 伸縮後實際寬度
      originalX: null, // 滑鼠點下的位置
      isDown: false, // 是否觸發滑鼠按著不放
      isShowResizeBar: false,
    });

    const handleMouseDown = (e) => {
      if (window.innerWidth <= 825) return;
      dragSidebarData.isDown = true;
      dragSidebarData.currentWidth = dragSidebar.value.offsetWidth;
      dragSidebarData.originalX = e.clientX;

      document.addEventListener("mousemove", handleMouseMove);
    };

    // 滑鼠移動
    const handleMouseMove = (e) => {
      dragSidebarData.isShowResizeBar = true;
      if (dragSidebarData.isDown) {
        dragSidebarData.realWidth = e.clientX;
        // dragSidebarData.realWidth = dragSidebarData.currentWidth - (dragSidebarData.originalX - e.clientX)
        if (dragSidebarData.realWidth >= 500) {
          dragSidebarData.realWidth = 500;
        } else if (dragSidebarData.realWidth <= 280) {
          $bus.emit("onCollapse", true);
          dragSidebarData.realWidth = 88;
        } else {
          $bus.emit("onCollapse", false);
          // dragSidebarData.realWidth = 60
        }
      }
    };

    const handleMouseUp = (e) => {
      // console.log(e)
      dragSidebarData.isShowResizeBar = false;
      if (dragSidebarData.isDown) {
      }
      dragSidebarData.isDown = false;
      document.removeEventListener("mousemove", handleMouseMove);
    };
    // 扣掉 sidebar padding-right:10px
    const contentWidth = computed(
      () => `width: calc(100% - ${dragSidebarData.realWidth}px - 10px)`
    );

    const updateSidebarWidth = (val) => {
      dragSidebarData.realWidth = val;
    };

    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    const isShowLayoutLoading = computed(() => {
      return store.getters.isShowLayoutLoading;
    });

    const isAPIProcessing = computed(() => {
      return store.getters.isAPIProcessing;
    });

    const changeMode = () => {
      store.commit("SET_LAYOUT_MODE", !isVerticalMode.value);
    };

    // 編輯時，避免按delete觸發sidebar 的 delete事件
    const deleteByKeyDown = () => {
      document.onkeydown = null;
    };

    const currentInnerWidth = ref(null);

    const detectWindowSize = () => {
      currentInnerWidth.value = window.innerWidth;
      if (currentInnerWidth.value <= 900) {
        $bus.emit("onCollapse", true);
      }
    };

    // window.innerWidth < 900時，取消 sidebar resize功能
    const isDisableResize = computed(() => {
      if (currentInnerWidth.value <= 900) return true;
      return false;
    });

    onMounted(() => {
      document.addEventListener("mouseup", handleMouseUp);

      window.addEventListener("resize", detectWindowSize);
      detectWindowSize();
    });

    onBeforeUnmount(() => {
      window.addEventListener("resize", detectWindowSize);
    });

    const isShowShortcut = ref(false);

    const isShowTrashPage = ref(false);

    const onSync = Helper.throttle(async () => {
      if (isAPIProcessing.value) return;
      window.doActivity();
    });

    const isShowLog = ref(false);
    const isSettingDialog = ref(false);

    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    onMounted(() => {
      ipcRenderer.send("init-websocket", userState.value.id);
      // ipcRenderer.send("check-for-updates", userState.value.id);
    });

    const isShowConfirmInvitationDialog = ref(false);
    const inviteCode = ref("");

    ipcRenderer.on("invite-participant", async (event, arg) => {
      inviteCode.value = arg.inviteCode;
      isShowConfirmInvitationDialog.value = true;
    });

    const isShowUpdateVersionDialog = ref(false);

    ipcRenderer.on("update-version", async (event, arg) => {
      isShowUpdateVersionDialog.value = true;
    });

    return {
      dragSidebar,
      dragSidebarData,
      handleMouseDown,
      handleMouseMove,
      contentWidth,
      updateSidebarWidth,
      changeMode,
      isVerticalMode,
      isShowShortcut,
      deleteByKeyDown,
      isShowTrashPage,
      isDisableResize,
      onSync,
      isShowLog,
      isShowLayoutLoading,
      isAPIProcessing,
      isSettingDialog,
      isShowConfirmInvitationDialog,
      inviteCode,
    };
  },
};
</script>
<style lang="scss" scoped>
// $header-height: 80px;
$header-height: 65px;
$footer-height: 30px;

.layout {
  height: 100%;
}

.layout-side {
  padding-right: 10px;
  background-color: $primary-light-grey;

  &__sidebar {
    position: relative;
    height: 100%;
  }

  &__sidebar-border-click {
    position: relative;
    width: 100%;
    height: 100%;
    padding-right: 8px;
    // cursor: w-resize;
  }
}

.add-transition {
  transition: all ease-in 0.3s;
}

.layout-header {
  height: $header-height;
  padding: 0 24px 0 0;
  background-color: $primary-light-grey;
}

.layout-container {
  // height: 100%;
  height: calc(100% - #{$header-height} - #{$footer-height});
  display: flex;
  background-color: $primary-light-grey;

  &__content {
    position: relative;
    height: 100%;
    transition: all ease-in 0.3s;

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 6px 0 0 0;
      background-color: $secondary-light-grey;
      z-index: 0;
      content: "";
    }
  }

  &__builder {
    width: 100%;
    height: 100%;
  }

  &__footer {
    height: $footer-height;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-top: 1px solid #f2f2f2;
    background-color: $primary-white;
    position: fixed;
    width: 100%;
    z-index: 10000;
  }
}

.resize-bar {
  position: absolute;
  top: 41px;
  bottom: 0;
  right: -10px;
  width: 2.5px;
  height: 95.5%;
  z-index: 10;

  .resize-bar__body {
    width: 100%;
    height: 100%;
    background-color: $primary-blue;
  }

  &:hover {
    background-color: $primary-blue;
  }
}

.resize-cursor {
  cursor: w-resize;
}

.default-cursor {
  cursor: unset;

  &:hover {
    background-color: unset;
  }
}

.operation-bar {
  display: flex;
  align-items: center;

  &__item {
    // width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 8px;
    text-align: center;

    .ant-btn {
      display: flex;
      align-items: center;
      padding: 0 4px;
      border: none;
      background: transparent;

      &:hover {
        border-color: unset;
        background: transparent;
      }
    }

    .ant-btn[disabled] {
      border: none;
      background: transparent;

      &:hover {
        color: $primary-dark-grey;
        border-color: unset;
        background: transparent;
      }
    }

    .ant-btn-default:not(:disabled):hover {
      &:hover {
        color: $primary-dark-grey;
      }
    }
  }

  .layout {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .icon-horizontal {
    position: relative;
    width: 100%;
    height: 100%;
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
      .icon-horizontal--not-hover {
        opacity: 0;
      }

      .icon-horizontal--hover {
        opacity: 1;
      }
    }
  }

  .icon-vertical {
    position: relative;
    width: 100%;
    height: 100%;
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
      .icon-vertical--not-hover {
        opacity: 0;
      }

      .icon-vertical--hover {
        opacity: 1;
      }
    }
  }

  .keyboard-shortcut {
    width: 20px;
    height: 20px;
  }

  .icon-keyboard {
    width: 100%;
    height: 100%;
    display: block;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/footer/icon-keyboard.png");
    cursor: pointer;

    &:hover {
      background-position-y: center;
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/footer/icon-keyboard-hover.png");
    }
  }

  &__item-name {
    margin-left: 5px;
  }
}

.data-operation {
  display: flex;
  align-items: center;
  gap: 12px;

  &__item {
    cursor: pointer;

    .anticon {
      display: block;
      font-size: 14px;
    }

    svg {
      height: 16px;
      object-fit: contain;
    }

    img {
      width: 16px;
      height: 100%;
      object-fit: contain;
    }

    &--on-sync {
      animation: rotating 2s linear infinite;
      cursor: not-allowed;
    }
  }

  &__item-label {
    padding-left: 5px;
    font-size: $text-size-xs;
  }
}

@keyframes rotating {
  from {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }

  to {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>

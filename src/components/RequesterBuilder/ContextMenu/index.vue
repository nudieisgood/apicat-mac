<template>
  <div
    class="context-menu-wrapper"
    :style="`top:${menuTop}; left:${menuLeft}`"
    v-click-outside="onClickOutside"
  >
    <div class="context-menu-container">
      <div class="context-menu">
        <div
          class="context-menu__item"
          v-for="(item, index) in options"
          :key="index"
          @click.stop="handleFunc(item.funcName)"
        >
          <span class="context-menu__item-label">
            {{ item.label }}
          </span>
          <span class="context-menu__item-short-cut">
            {{ item.shortCut }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, watch, toRefs, computed, ref, inject } from "vue";
import { useStore } from "vuex";

export default {
  name: "contextMenu",
  components: {},
  props: {
    positionData: {
      type: Object,
      default: () => {},
    },
    menuVisible: {
      type: Boolean,
      default: false,
    },
    tabData: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "close-context-menu": null,
    "handle-close-all-tabs": null,
    "show-confirm-dialog": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
    const store = useStore();
    const { positionData, menuVisible, tabData } = toRefs(props);

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    const menuLeft = computed(() => `${positionData.value.left}px`);
    const menuTop = computed(() => `${positionData.value.top}px`);
    const options = reactive([
      {
        label: "Duplicate Tab",
        shortCut: "",
        funcName: "duplicate",
      },
      {
        label: "Close all tabs",
        shortCut: "",
        funcName: "closeAllTabs",
      },
      {
        label: "Force close all tabs",
        shortCut: "",
        funcName: "forceCloseAllTabs",
      },
      {
        label: tabData.value.isPin ? "Unpin" : "Pin",
        shortCut: "",
        funcName: tabData.value.isPin ? "unpin" : "pin",
      },
    ]);

    const handleFunc = (funcName) => {
      if (funcName === "pin") {
        pin();
      } else if (funcName === "forceCloseAllTabs") {
        forceCloseAllTabs();
      } else if (funcName === "closeAllTabs") {
        closeAllTabs();
      } else if (funcName === "duplicate") {
        duplicate();
      } else if (funcName === "unpin") {
        unpin();
      }
      closeContextMenu();
    };

    const isShowContextMenu = ref(false);

    watch(
      menuVisible,
      () => {
        isShowContextMenu.value = menuVisible.value;
      },
      {
        immediate: true,
      }
    );

    const closeContextMenu = () => {
      context.emit("close-context-menu");
    };

    const totalEditingTabNum = ref(0);

    const forceCloseAllTabs = () => {
      // 要先判斷當前是否有正在編輯中的tab，有的話顯示ConfirmDialog，沒有的話直接移除全部tab
      const editTabList = tabsPane.value.filter((tab) => tab.isEditing);
      if (editTabList.length === 0) {
        store.commit("CLEAR_ALL_TAB");
      } else {
        totalEditingTabNum.value = editTabList.length;
        context.emit("show-confirm-dialog", editTabList.length);
      }
    };

    const closeAllTabs = () => {
      // 先篩選正在編輯的tab資料
      const filterTabPane = tabsPane.value.filter((tab) => tab.isEditing);
      store.commit("UPDATE_TAB_ARRAY", filterTabPane);
      if (filterTabPane.length > 0) {
        context.emit("handle-close-all-tabs");
      } else {
        // 沒有正在編輯的 tab，直接移除全部tab
        store.commit("CLEAR_ALL_TAB");
      }
    };

    const duplicate = () => {
      // 先複製一份欲複製的資料
      const copyTabData = JSON.parse(JSON.stringify(tabData.value));
      // 新定義一個tabKey，避免同時被focus
      copyTabData.tabKey = Date.now();
      // 將欲複製資料新增至 tabsPane，並切換至該tab頁面
      $bus.emit("handleTabAddAndFocused", copyTabData);
    };

    const pin = () => {
      // 被選中的tab移至最前面
      const originalTab = tabsPane.value.find(
        (e) =>
          e.tabKey === tabData.value.tabKey &&
          e.tabType === tabData.value.tabType
      );
      const originalTabIndex = tabsPane.value.findIndex(
        (e) =>
          e.tabKey === tabData.value.tabKey &&
          e.tabType === tabData.value.tabType
      );
      if (originalTabIndex > -1 && originalTabIndex === 0) {
        // 表示該tab已經是在第一個位置
        return;
      }
      tabsPane.value.splice(originalTabIndex, 1); // 先刪掉原本的
      tabsPane.value.unshift(originalTab); // 新增至陣列第一個位置
      tabsPane.value[0].isPin = true;
      store.commit("UPDATE_TAB_ARRAY", tabsPane.value);
    };

    const unpin = () => {
      const originalTab = tabsPane.value.find(
        (e) =>
          e.tabKey === tabData.value.tabKey &&
          e.tabType === tabData.value.tabType
      );
      const originalTabIndex = tabsPane.value.findIndex(
        (e) =>
          e.tabKey === tabData.value.tabKey &&
          e.tabType === tabData.value.tabType
      );
      if (originalTabIndex > -1) {
        tabsPane.value.splice(originalTabIndex, 1); // 先刪掉原本的
        const unpinIndex = tabsPane.value.findIndex((e) => !e.isPin);
        if (unpinIndex > -1) {
          tabsPane.value.splice(unpinIndex, 0, originalTab); // 新增至非置頂區第一個位置
          tabsPane.value[unpinIndex].isPin = false;
        } else {
          // 都沒有非置頂的tab時，直接新增至陣列最後一個
          tabsPane.value.push(originalTab);
          tabsPane.value[tabsPane.value.length - 1].isPin = false;
        }
        store.commit("UPDATE_TAB_ARRAY", tabsPane.value);
      }
    };

    const onClickOutside = () => {
      closeContextMenu();
    };

    return {
      options,
      menuLeft,
      menuTop,
      handleFunc,
      totalEditingTabNum,
      closeContextMenu,
      unpin,
      onClickOutside,
    };
  },
};
</script>

<style lang="scss" scoped>
.context-menu-wrapper {
  position: fixed;
  top: 30%;
  left: 50%;
  min-width: 250px;
  // min-height: 250px;
  background-color: $primary-white;
  box-shadow: 1px 3px 8px 2px rgba(0, 0, 0, 0.25);
  z-index: 100;
}

.context-menu {
  padding: 10px 20px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }

  &__item-label {
    flex-basis: 80%;
  }

  &__item-short-cut {
    color: $primary-dark-grey;
  }
}
</style>

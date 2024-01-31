<template>
  <div id="folder-editor-tabs">
    <div class="tabs-list-wrapper" ref="tabsListWrapper">
      <div class="tabs-list">
        <div
          class="tabs-list__item"
          v-for="tab in tabList"
          :key="tab.value"
          @click="changeTab(tab)"
          :class="{
            'tabs-list__item--is-active': currentTabName === tab.tabName,
          }"
        >
          <span class="tabs-list__item-name">{{ tab.tabName }}</span>
        </div>
      </div>
    </div>
    <div class="tabs-pane" ref="tabsListRef">
      <div class="tabs-pane__content" v-if="currentTabName === 'Authorization'">
        <authorization-block
          :auth-info="tabInfo.auth"
          v-if="activeKey === 'authorization'"
          @update-auth-type="updateAuthType"
          @update-bearer-token="updateBearerToken"
          :tab-info="tabInfo"
        />
      </div>
      <div
        class="tabs-pane__content"
        v-else-if="currentTabName === 'Pre-request Script'"
      >
        <scripts-editor
          :tab-info="tabInfo"
          :current-tab-name="currentTabName"
          :current-tab-key="currentTabKey"
          v-model="codeEditorValue"
        />
      </div>
      <div class="tabs-pane__content" v-else>
        <scripts-editor
          :tab-info="tabInfo"
          :current-tab-name="currentTabName"
          :current-tab-key="currentTabKey"
          v-model="codeEditorValue"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, reactive, toRefs, nextTick, watch } from "vue";
// import AuthorizationBlock from "@/components/FolderEditor/authorizationBlock.vue";
import tabsData from "@/store/tabs";
import AuthTypeEnum from "@/js/enum/authTypeEnum";
import ScriptsEditor from "@/components/ScriptsEditor";
import AuthorizationBlock from "@/components/Authorization";

export default {
  name: "folderEditor",
  components: {
    AuthorizationBlock,
    ScriptsEditor,
  },
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "get-active-key": null,
  },
  setup(props, context) {
    const { tabInfo } = toRefs(props);
    const activeKey = ref("authorization");
    const tabList = reactive([
      {
        key: "authorization",
        tabName: "Authorization",
        value: "authorization",
      },
      {
        key: "prerequest",
        tabName: "Pre-request Script",
        value: "prerequest",
      },
      {
        key: "test",
        tabName: "Tests",
        value: "test",
      },
    ]);

    const handleTabs = (key) => {
      activeKey.value = key;
      const tabInfo = tabList.find((e) => e.key === key);

      if (tabInfo) {
        context.emit("get-active-key", tabInfo);
      }
    };

    const updateAuthType = (authType) => {
      tabInfo.value.auth.type = authType;
    };

    const updateBearerToken = (bearerToken) => {
      if (tabInfo.value.auth.type === AuthTypeEnum.BEARER) {
        if (bearerToken) {
          tabInfo.value.auth[AuthTypeEnum.BEARER] = [
            { key: "token", value: bearerToken, type: "string" },
          ];
        } else {
          tabInfo.value.auth[AuthTypeEnum.BEARER] = [];
        }
      }
    };

    const tabsListRef = ref(null);
    const tabsListWrapper = ref(null);

    onMounted(() => {
      handleTabs("authorization");
      nextTick(() => {
        const tabsListWrapperClientHeight = tabsListWrapper.value.clientHeight;
        tabsListRef.value.style.height = `calc(100% - ${tabsListWrapperClientHeight}px)`;
      });
    });

    const currentTabName = ref("Authorization");
    const currentTabKey = ref("authorization");

    const changeTab = (tab) => {
      currentTabName.value = tab.tabName;
      currentTabKey.value = tab.key;
    };

    const codeEditorValue = ref("");

    watch(
      currentTabName,
      () => {
        if (currentTabName.value === "Authorization") return;
        const result = tabsData.getFormattedScript(
          tabInfo.value,
          currentTabKey.value
        );
        if (!result) {
          codeEditorValue.value = "";
        } else {
          codeEditorValue.value = result;
        }
      },
      {
        immediate: true,
      }
    );

    watch(codeEditorValue, () => {
      tabsData.setScript(
        codeEditorValue.value,
        currentTabKey.value,
        tabInfo.value
      );
    });

    return {
      handleTabs,
      activeKey,
      tabList,
      tabsData,
      updateAuthType,
      updateBearerToken,
      currentTabName,
      changeTab,
      tabsListRef,
      tabsListWrapper,
      codeEditorValue,
      currentTabKey,
    };
  },
};
</script>
<style lang="scss" scoped>
$tabs-header-height: 32px;
$tabs-list-height: 34px;

#folder-editor-tabs {
  height: 100%;
  // height: calc(100% - #{$tabs-header-height});

  &:deep(.ant-tabs-tab-active) {
    color: $primary-blue;
  }

  &:deep(.ant-tabs-ink-bar) {
    background-color: $primary-blue;
  }

  &:deep(.ant-tabs-nav) {
    .ant-tabs-tab {
      &:hover {
        color: $light-blue;
        box-shadow: inset 0 -3px 0 $light-blue;
      }
    }
  }
}

.tabs-list-wrapper {
  overflow-x: scroll;
  padding-bottom: 3px;
}

.tabs-list {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid $secondary-light-grey;

  &__item {
    width: 130px;
    padding: 6px 0;
    text-align: center;
    color: $primary-dark-grey;
    cursor: pointer;

    &--is-active {
      color: $primary-blue;
      box-shadow: inset 0 -2px 0 $primary-blue;
    }

    &:hover {
      color: $light-blue;
      // border-bottom: 1px solid $light-blue;
      box-shadow: inset 0 -2px 0 $light-blue;
    }
  }
}

.tabs-pane {
  height: calc(100% - #{$tabs-list-height});
  padding: 10px 0;

  &__content {
    height: 100%;
  }
}
</style>

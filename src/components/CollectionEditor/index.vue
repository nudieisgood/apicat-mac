<template>
  <div id="collection-editor-tabs">
    <div class="tabs-list-wrapper" ref="tabsListWrapper">
      <div class="tabs-list">
        <div
          class="tabs-list__item"
          v-for="tab in tabList"
          :key="tab.key"
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
          @update-auth-type="updateAuthType"
          @update-bearer-token="updateBearerToken"
          :tab-info="tabInfo"
        />
      </div>
      <div
        class="tabs-pane__content"
        v-else-if="currentTabName === 'Variables'"
      >
        <variables-table :tab-info="tabInfo" />
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
import AuthorizationBlock from "@/components/Authorization";
// import AuthorizationBlock from "@/components/CollectionEditor/authorizationBlock.vue";
import VariablesTable from "@/components/CollectionEditor/variablesTable.vue";
import tabsData from "@/store/tabs";
import AuthTypeEnum from "@/js/enum/authTypeEnum";
import ScriptsEditor from "@/components/ScriptsEditor";

export default {
  name: "collectionEditor",
  components: {
    AuthorizationBlock,
    VariablesTable,
    // PreRequest,
    // TestScript,
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
    const tabList = reactive([
      {
        tabName: "Authorization",
        key: "authorization",
      },
      {
        tabName: "Pre-request Script",
        key: "prerequest",
      },
      {
        tabName: "Tests",
        key: "test",
      },
      {
        tabName: "Variables",
        key: "variables",
      },
    ]);

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
        if (
          currentTabName.value === "Authorization" ||
          currentTabName.value === "Variables"
        )
          return;
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
    // watch(
    //   currentTabName,
    //   () => {
    //     if (currentTabName.value === "Tests") {
    //       const testsResult = tabsData.getFormattedTestsScript(tabInfo.value);
    //       if (!testsResult) {
    //         codeEditorValue.value = "";
    //       } else {
    //         codeEditorValue.value = testsResult;
    //       }
    //     } else {
    //       const preRequestResult = tabsData.getFormattedPrerequest(
    //         tabInfo.value
    //       );
    //       if (!preRequestResult) {
    //         codeEditorValue.value = "";
    //       } else {
    //         codeEditorValue.value = preRequestResult;
    //       }
    //     }
    //   },
    //   {
    //     immediate: true,
    //   }
    // );

    watch(codeEditorValue, () => {
      tabsData.setScript(
        codeEditorValue.value,
        currentTabKey.value,
        tabInfo.value
      );
    });
    // watch(codeEditorValue, () => {
    //   if (currentTabName.value === "Tests") {
    //     tabsData.setTestsScript(codeEditorValue.value, "test", tabInfo.value);
    //   } else {
    //     tabsData.setPrerequest(
    //       codeEditorValue.value,
    //       "prerequest",
    //       tabInfo.value
    //     );
    //   }
    // });

    return {
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
// $tabs-header-height: 47.7px;
// $tabs-list-height: 61px;

#collection-editor-tabs {
  height: 100%;
  // height: calc(100% - #{$tabs-header-height});
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
  // height: calc(100% - #{$tabs-list-height});
  padding: 10px 0;

  &__content {
    height: 100%;
  }
}
</style>

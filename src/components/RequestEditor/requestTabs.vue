<template>
  <div id="request-tabs">
    <div class="request-tabs-header">
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
      <div class="action">
        <div class="action__item" @click="showCookiesDialog = true">
          <span class="action__item-name">Cookies</span>
        </div>
      </div>
    </div>
    <div class="request-tabs-pane">
      <div
        class="request-tabs-pane__content"
        v-if="currentTabName === 'Params'"
      >
        <params-table
          :query-data="tabInfo.request.url.query"
          :request-url="tabInfo.request.url.raw"
          @update-request-url="updateRequestUrl"
          @update-query-data="updateQueryData"
          :tab-info="tabInfo"
        />
      </div>
      <div
        class="request-tabs-pane__content"
        v-else-if="currentTabName === 'Authorization'"
      >
        <authorization :tab-info="tabInfo" />
      </div>
      <div
        class="request-tabs-pane__content"
        v-else-if="currentTabName === 'Headers'"
      >
        <headers-table
          :header-array="tabInfo.request.header"
          :tab-info="tabInfo"
        />
      </div>
      <div
        class="request-tabs-pane__content"
        v-else-if="currentTabName === 'Body'"
      >
        <div class="body-type">
          <a-radio-group
            name="radioGroup"
            :value="tabInfo.request.body.mode"
            @change="handleDataTypeChange"
          >
            <a-radio
              v-for="(type, index) in dataTypeList"
              :key="`${type.dataType}-${index}`"
              :value="type.dataType"
              >{{ type.dataType }}</a-radio
            >
          </a-radio-group>
          <a
            class="beautify-button"
            href="#"
            @click="prettifyJSON"
            v-if="
              tabInfo.request.body.mode ===
              DataTypeEnum.APPLICATION_JSON.dataType
            "
            >Beautify</a
          >
        </div>
        <div class="body-content">
          <p v-show="tabInfo.request.body.mode === DataTypeEnum.NONE.dataType">
            This request does not have a body.
          </p>
          <form-data-table
            v-show="
              tabInfo.request.body.mode ===
              DataTypeEnum.MULTIPART_FORMDATA.dataType
            "
            :formdata-array="tabInfo.request.body.formdata"
            :tab-info="tabInfo"
          />
          <url-encoded-table
            v-show="
              tabInfo.request.body.mode === DataTypeEnum.URLENCODED.dataType
            "
            :tab-info="tabInfo"
            :url-encoded-arr="tabInfo.request.body.urlencoded"
          />
          <editor
            v-show="
              tabInfo.request.body.mode ===
              DataTypeEnum.APPLICATION_JSON.dataType
            "
            :mode-value="DataTypeEnum.APPLICATION_JSON.rawType"
            v-model="bodyRawEditorValue"
            :tab-info="tabInfo"
            ref="bodyEditorRef"
          />
        </div>
      </div>
      <div
        class="request-tabs-pane__content"
        v-else-if="currentTabName === 'Pre-request Script'"
      >
        <scripts-editor
          :tab-info="tabInfo"
          :current-tab-name="currentTabName"
          :current-tab-key="currentTabKey"
          v-model="scriptCodeEditorValue"
        />
      </div>
      <div class="request-tabs-pane__content" v-else>
        <scripts-editor
          :tab-info="tabInfo"
          :current-tab-name="currentTabName"
          :current-tab-key="currentTabKey"
          v-model="scriptCodeEditorValue"
        />
      </div>
    </div>
  </div>
  <cookies
    v-if="showCookiesDialog"
    :dialogVisible="showCookiesDialog"
    @close-cookies-dialog="showCookiesDialog = false"
  />
</template>

<script>
import { ref, toRefs, reactive, watch, nextTick } from "vue";
import editor from "@/components/BodyEditor";
import ParamsTable from "@/components/ParamsTable";
import HeadersTable from "@/components/HeadersTable";
import FormDataTable from "@/components/FormDataTable";
import UrlEncodedTable from "@/components/UrlEncodedTable";
import Authorization from "@/components/RequestEditor/authorization.vue";
import requestData from "@/store/requestData";
import Cookies from "@/components/Cookies";
import tabsData from "@/store/tabs";
import ScriptsEditor from "@/components/ScriptsEditor";
import DataTypeEnum, {
  dataTypeList,
  getRawTypeFromDataType,
} from "@/js/enum/dataTypeEnum";
import { useStore } from "vuex";

export default {
  components: {
    editor,
    ParamsTable,
    HeadersTable,
    FormDataTable,
    UrlEncodedTable,
    Authorization,
    Cookies,
    ScriptsEditor,
  },
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  setup(props, context) {
    const store = useStore();
    const { tabInfo } = toRefs(props);
    const handleDataTypeChange = ($event) => {
      tabInfo.value.request.body.mode = $event.target.value;
    };

    const showCookiesDialog = ref(false);

    const updateRequestUrl = (url) => {
      tabInfo.value.request.url.raw = url;
    };

    const updateRaw = (raw) => {
      tabInfo.value.request.body.raw = raw;
    };

    const tabList = reactive([
      {
        tabName: "Params",
        key: "params",
      },
      {
        tabName: "Headers",
        key: "headers",
      },
      {
        tabName: "Authorization",
        key: "authorization",
      },
      {
        tabName: "Body",
        key: "body",
      },
      {
        tabName: "Pre-request Script",
        key: "prerequest",
      },
      {
        tabName: "Tests",
        key: "test",
      },
    ]);

    const currentTabName = ref("Params");
    const currentTabKey = ref("params");

    const changeTab = (tab) => {
      currentTabName.value = tab.tabName;
      currentTabKey.value = tab.key;
      tabInfo.value.currentTabName = tab.tabName; // 賦值後，tabsData.tabInfo.originalTab 也要更新，避免影響橘點顯示
      tabsData.tabInfo.originalTab.currentTabName = tab.tabName;

      store.commit("UPDATE_TAB", tabInfo.value);
    };

    const updateQueryData = (query) => {
      tabInfo.value.request.url.query = query;
      tabsData.refreshUrl(tabInfo.value.request);
    };

    const bodyRawEditorValue = ref("");
    const scriptCodeEditorValue = ref("");

    watch(
      tabInfo,
      () => {
        if (tabInfo.value.currentTabName) {
          currentTabName.value = tabInfo.value.currentTabName; // 賦值後，tabsData.tabInfo.originalTab 也要更新，避免影響橘點顯示
          tabsData.tabInfo.originalTab.currentTabName =
            tabInfo.value.currentTabName;
          const tab = tabList.find((e) => e.tabName === currentTabName.value);
          if (tab) {
            currentTabKey.value = tab.key;
          }
        } else {
          currentTabName.value = "Params";
          currentTabKey.value = "params";
        }
        bodyRawEditorValue.value = tabInfo.value.request.body.raw;
      },
      {
        immediate: true,
      }
    );

    watch(bodyRawEditorValue, () => {
      tabInfo.value.request.body.raw = bodyRawEditorValue.value;
    });

    watch(
      currentTabName,
      () => {
        if (
          currentTabName.value === "Params" ||
          currentTabName.value === "Headers" ||
          currentTabName.value === "Authorization" ||
          currentTabName.value === "Body"
        )
          return;

        const result = tabsData.getFormattedScript(
          tabInfo.value,
          currentTabKey.value
        );

        if (!result) {
          scriptCodeEditorValue.value = "";
        } else {
          scriptCodeEditorValue.value = result;
        }
      },
      {
        immediate: true,
      }
    );

    watch(scriptCodeEditorValue, () => {
      tabsData.setScript(
        scriptCodeEditorValue.value,
        currentTabKey.value,
        tabInfo.value
      );
    });

    const bodyEditorRef = ref(null);

    const prettifyJSON = (event) => {
      event.preventDefault();
      nextTick(() => {
        bodyEditorRef.value.prettifyJSON();
      });
    };

    return {
      requestData,
      showCookiesDialog,
      handleDataTypeChange,
      tabsData,
      dataTypeList,
      DataTypeEnum,
      updateRequestUrl,
      updateRaw,
      tabList,
      changeTab,
      currentTabName,
      updateQueryData,
      bodyRawEditorValue,
      scriptCodeEditorValue,
      currentTabKey,
      prettifyJSON,
      bodyEditorRef,
    };
  },
};
</script>
<style lang="scss" scoped>
$request-tabs-header-height: 34px;

.content {
  width: 400px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 4px;
}

.body-type {
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 12px;
}

.body-content {
  height: calc(100% - 47px);
  // padding: 12px 0;
  overflow-y: auto;

  p {
    text-align: center;
  }
}

.editable-add-btn {
  display: block;
  margin-left: auto;
}

.ertra-item {
  margin-right: 12px;
  color: #005ab5;
  font-weight: 500;
  line-height: 45px;
  cursor: pointer;
}

.formdata-type {
  .ant-select {
    color: #005ab5;
    font-weight: 500;
  }
}

#request-tabs {
  height: 100%;
}

.request-tabs-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex: 1 1 auto;
  // overflow-x: scroll;
  gap: 20px;
}

.tabs-list {
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 3px;
  transition: all 0.5s;
  overflow-x: scroll;

  &__item {
    min-width: 120px;
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

  // &__item-name {
  //   padding: 8px 0;
  // }
}

.action {
  flex-basis: 15%;
  text-align: right;

  &__item {
    padding-right: 8px;
    color: #005ab5;
    cursor: pointer;
  }
}

.request-tabs-pane {
  height: calc(100% - #{$request-tabs-header-height});

  &__content {
    height: 100%;
    padding: 8px 0;
  }
}

.beautify-button {
  padding-right: 8px;
}
</style>

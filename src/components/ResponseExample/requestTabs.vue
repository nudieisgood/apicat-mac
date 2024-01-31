<template>
  <div id="request-tabs">
    <div class="request-tabs-box">
      <div class="tab-wrapper">
        <div
          class="tab"
          v-for="tab in tabList"
          :key="tab.key"
          :class="{ 'tab--is-active': tab.tabName === currentTabName }"
          @click="changeTab(tab)"
        >
          {{ tab.tabName }}
        </div>
      </div>
      <div class="tab-container">
        <params-table
          :query-data="tabInfo.originalRequest.url.query"
          :request-url="tabInfo.originalRequest.url.raw"
          @update-request-url="updateRequestUrl"
          :tab-info="tabInfo.originalRequest"
          v-if="currentTabName === 'Params'"
        />
        <headers-table
          :header-array="tabInfo.originalRequest.header"
          :tab-info="tabInfo"
          v-else-if="currentTabName === 'Headers'"
        />
        <div class="body-container" v-else-if="currentTabName === 'Body'">
          <div class="body-type">
            <a-radio-group
              name="radioGroup"
              :value="tabInfo.originalRequest?.body?.mode"
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
                tabInfo.originalRequest.body.mode ===
                DataTypeEnum.APPLICATION_JSON.dataType
              "
              >Beautify</a
            >
          </div>
          <div class="body-content">
            <!-- none -->
            <p
              v-if="
                tabInfo.originalRequest.body.mode === DataTypeEnum.NONE.dataType
              "
            >
              This request does not have a body.
            </p>
            <!-- form-data -->
            <form-data-table
              v-else-if="
                tabInfo.originalRequest.body.mode ===
                DataTypeEnum.MULTIPART_FORMDATA.dataType
              "
              :formdata-array="tabInfo.originalRequest.body.formdata"
              :tab-info="tabInfo"
            />
            <!-- url encoded -->
            <url-encoded-table
              v-else-if="
                tabInfo.originalRequest.body.mode ===
                DataTypeEnum.URLENCODED.dataType
              "
              :tab-info="tabInfo"
              :url-encoded-arr="tabInfo.originalRequest.body.urlencoded"
            />
            <!-- raw editor -->
            <editor
              v-else-if="
                tabInfo.originalRequest.body.mode ===
                DataTypeEnum.APPLICATION_JSON.dataType
              "
              :mode-value="DataTypeEnum.APPLICATION_JSON.rawType"
              :model-value="tabInfo.originalRequest.body.raw"
              @update-raw="updateRaw"
              :tab-info="tabInfo"
              ref="bodyEditorRef"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, ref, watch, nextTick } from "vue";
import editor from "@/components/BodyEditor";
import ParamsTable from "@/components/ParamsTable";
import HeadersTable from "@/components/HeadersTable";
import FormDataTable from "@/components/FormDataTable";
import UrlEncodedTable from "@/components/UrlEncodedTable";
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
// import DataTypeEnum, { dataTypeList } from '@/js/enum/dataTypeEnum'
import DataTypeEnum, { dataTypeList } from "@/js/enum/dataTypeEnum";
// import DataTypeEnum, { dataTypeList, getRawTypeFromDataType } from '@/js/enum/dataTypeEnum'
import { useStore } from "vuex";

export default {
  components: {
    editor,
    ParamsTable,
    HeadersTable,
    FormDataTable,
    UrlEncodedTable,
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

    const currentTabName = ref("Params");

    const tabList = reactive([
      {
        tabName: "Params",
        key: "params",
      },
      {
        tabName: "Headers",
        key: "header",
      },
      {
        tabName: "Body",
        key: "body",
      },
    ]);

    const changeTab = (tab) => {
      currentTabName.value = tab.tabName;
      // tabInfo.value.currentTabName = tab.tabName; // NOTE：此會影響判斷編輯狀態，但還是要記錄(如果重開時要維持上次點開畫面)
      store.commit("UPDATE_TAB", tabInfo.value);
    };

    const handleDataTypeChange = ($event) => {
      tabInfo.value.originalRequest.body.mode = $event.target.value;
    };

    const updateRequestUrl = (url) => {
      tabInfo.value.originalRequest.url.raw = url;
    };

    const updateRaw = (raw) => {
      tabInfo.value.originalRequest.body.raw = raw;
    };

    // NOTE：目前沒用到，先保留
    const updateQueryData = (query) => {
      tabInfo.value.originalRequest.url.query = query;
      tabsData.refreshUrl(tabInfo.value.originalRequest);
    };

    watch(
      tabInfo,
      () => {
        if (tabInfo.value.currentTabName) {
          // currentTabName.value = tabInfo.value.currentTabName; // NOTE：此會影響判斷編輯狀態，但還是要記錄(如果重開時要維持上次點開畫面)
        } else {
          currentTabName.value = "Params";
        }
      },
      {
        immediate: true,
      }
    );

    const bodyEditorRef = ref(null);

    const prettifyJSON = (event) => {
      event.preventDefault();
      nextTick(() => {
        bodyEditorRef.value.prettifyJSON();
      });
    };

    return {
      requestData,
      handleDataTypeChange,
      tabsData,
      dataTypeList,
      DataTypeEnum,
      updateRequestUrl,
      updateRaw,
      tabList,
      currentTabName,
      changeTab,
      updateQueryData,
      prettifyJSON,
      bodyEditorRef,
    };
  },
};
</script>
<style lang="scss" scoped>
$tabs-wrapper-height: 43px;

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
  height: calc(100% - 45px);
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

.request-tabs-box {
  height: 100%;
}

.tab-wrapper {
  width: fit-content;
  height: 43px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 3px;
  transition: all 0.5s;
  overflow-x: scroll;
}

.tab {
  min-width: 120px;
  padding: 6px 0;
  text-align: center;
  font-size: $text-size-m;
  cursor: pointer;

  &--is-active {
    color: $primary-blue;
    box-shadow: inset 0 -2px 0 $primary-blue;
  }

  &:hover {
    color: $light-blue;
    box-shadow: inset 0 -2px 0 $light-blue;
  }
}

.tab-container {
  height: calc(100% - #{$tabs-wrapper-height});
}

.body-container {
  height: 100%;
}

.beautify-button {
  padding-right: 8px;
}
</style>

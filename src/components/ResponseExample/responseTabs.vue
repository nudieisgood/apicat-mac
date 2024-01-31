<template>
  <div class="response-error" v-if="tabInfo.code < 0 || !tabInfo.code">
    <div class="response-error__header">
      <span>Response</span>
    </div>
    <div class="response-error__content">
      <div class="error-image">
        <img :src="require('@/assets/img/image-error.jpg')" alt="" />
      </div>
      <p class="error-message">Could not send request</p>
      <p class="error-text mark">{{ tabInfo.body }}</p>
    </div>
  </div>
  <div
    id="response-tabs"
    v-else
    :class="[
      { 'row-style': !isVerticalMode || isChangeHeaderStyle },
      { 'column-style': isVerticalMode || !isChangeHeaderStyle },
    ]"
  >
    <div class="response-tabs-box">
      <div class="box-header">
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
        <div class="status">
          <div class="status__row">
            <span class="status__label">Status Code:</span>
            <a-select
              show-search
              placeholder="Enter Response Code"
              :options="
                resStatusList.map((e) => ({
                  label: `${e.code} ${e.desc}`,
                  value: e.code,
                }))
              "
              @change="handleStatusCodeChange"
              :value="tabInfo.code"
            />
          </div>
        </div>
      </div>

      <div class="tab-container" :style="{ height: panesHeight }">
        <div class="body-container" v-show="currentTabName === 'Body'">
          <editor
            :model-value="bodyCode"
            :tab-info="tabInfo"
            :read-only="false"
            @update-raw="updateRaw"
            @update:modelValue="bodyCode = $event"
            :content-type="currentContentType"
            key="example-response-editor"
            v-model="bodyCode"
          >
          </editor>
        </div>
        <response-headers-table
          :header-data="tabInfo.header"
          v-show="currentTabName === 'Headers'"
        />
      </div>
    </div>
  </div>
</template>
<script>
import {
  ref,
  watch,
  computed,
  toRefs,
  reactive,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import editor from "@/components/RequestEditor/ResponseTabs/responseEditor.vue";
import ResponseHeadersTable from "@/components/ResponseHeadersTable";
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
import { resStatusList, getStatusDesc } from "@/js/enum/resStatusEnum";
import Helper from "@/js/utils/helper";
import store from "@/store";

export default {
  components: {
    editor,
    ResponseHeadersTable,
  },
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },

  setup(props) {
    const { tabInfo } = toRefs(props);
    const bodyCode = ref("");
    const statusCodeText = ref("");
    const currentContentType = ref("");

    watch(
      tabInfo,
      () => {
        if (JSON.stringify(tabInfo.value) !== "{}") {
          const result = Helper.isJsonString(tabInfo.value.body);

          if (result) {
            bodyCode.value = JSON.stringify(
              JSON.parse(tabInfo.value.body),
              null,
              4
            );
          } else {
            bodyCode.value = tabInfo.value.body;
          }
          statusCodeText.value = `${tabInfo.value.code} ${tabInfo.value.status}`;
          const contentTypeRaw = tabInfo.value.header.find(
            (e) => e.key === "content-type"
          );
          if (contentTypeRaw) {
            currentContentType.value = contentTypeRaw.value;
          }
        } else {
          bodyCode.value = "";
        }
      },
      {
        immediate: true,
        deep: true,
      }
    );

    const statusText = computed(() => {
      if (tabInfo.value) {
        if (tabInfo.value.status === 200) {
          return "OK";
        } else if (tabInfo.value.status === 404) {
          return "Not Found";
        } else if (tabInfo.value.status === 400) {
          return "Bad Request";
        } else if (tabInfo.value.errno) {
          return tabInfo.value.data.message;
        }
      }
      return "";
    });

    const handleInput = ($event) => {
      statusCodeText.value = $event.target.value;
    };

    const currentTabName = ref("Body");

    const tabList = reactive([
      {
        tabName: "Body",
        key: "body",
      },
      {
        tabName: "Headers",
        key: "header",
      },
    ]);

    const changeTab = (tab) => {
      currentTabName.value = tab.tabName;
    };

    const updateRaw = (raw) => {
      tabInfo.value.body = raw;
    };

    const selectedStatus = ref("");

    const handleStatusCodeChange = (code) => {
      tabInfo.value.code = code;
      const statusDesc = getStatusDesc(code);
      tabInfo.value.status = statusDesc;
      tabInfo.value.isEditing = true;
    };

    const isChangeHeaderStyle = ref(false);

    const detectWindowSize = () => {
      if (window.innerWidth <= 1300) {
        isChangeHeaderStyle.value = true;
      } else {
        isChangeHeaderStyle.value = false;
      }
    };

    const panesHeight = computed(() => {
      if (isChangeHeaderStyle.value) {
        return "calc(100% - 85px)";
      }
      return "calc(100% - 48px)";
    });

    onMounted(() => {
      nextTick(() => {
        window.addEventListener("resize", detectWindowSize);
        detectWindowSize();
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", detectWindowSize);
    });

    const isVerticalMode = computed(() => {
      return store.getters.isVerticalMode;
    });

    return {
      bodyCode,
      statusText,
      requestData,
      tabsData,
      statusCodeText,
      handleInput,
      tabList,
      changeTab,
      currentTabName,
      updateRaw,
      resStatusList,
      handleStatusCodeChange,
      selectedStatus,
      panesHeight,
      isChangeHeaderStyle,
      currentContentType,
      isVerticalMode,
    };
  },
};
</script>
<style lang="scss" scoped>
$tabs-wrapper-height: 32px;
$tabs-container-padding: 20px;
$actions-margin: 12px;
$actions-height: 22px;

.status {
  display: flex;
  margin-right: 16px;
  line-height: 40px;

  &__row {
    display: flex;
    align-items: center;
    margin-right: 15px;

    .ant-tabs-extra-content {
      span {
        font-size: 12px;
      }
    }
  }

  &__value {
    margin-left: 15px;
    color: #01b468;
  }

  &__label {
    margin-right: 10px;
  }

  &:deep(.ant-select) {
    width: 200px;
    height: 26px;
  }
}

.cm-s-default .cm-string {
  color: yellow;
}

.no-data {
  height: 100%;

  &__header {
    margin-top: 10px;
    color: #3c3c3c;
  }
  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

#response-tabs {
  height: 100%;
}

.response-error {
  height: 300px;

  &__header {
    color: #3c3c3c;
  }
  &__content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
}

.error-image {
  width: 130px;
  height: 130px;
  margin-bottom: 10px;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.error-message {
  margin-bottom: 20px;
}

.error-text {
  padding: 3px 20px;
  border-radius: 20px;
  background-color: #ffdad9;
}

.response-tabs-box {
  height: 100%;
}

.box-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.tab-wrapper {
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
  color: $primary-dark-grey;
  font-size: $text-size-m;
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

.tab-container {
  height: calc(100% - #{$tabs-wrapper-height});
  // padding: 10px 0
}

.body-container {
  position: relative;
  height: 100%;
  padding-bottom: 10px;
  // height: calc(100% - #{$tabs-container-padding} - #{$actions-margin} - #{$actions-height});

  &:deep(.ace_search) {
    top: 34px;
  }
}

.row-style {
  .box-header {
    display: block;
  }
}

.column-style {
  .box-header {
    display: flex;
  }
}
</style>

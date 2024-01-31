<template>
  <div class="log-wrapper">
    <div class="log-header">
      <div class="log-header__left">
        <div class="log-header__title">Console</div>
      </div>
      <div class="log-header__right">
        <div class="log-header__item">
          <a-button @click="logStore.clearLogList">Clear</a-button>
        </div>
        <div class="log-header__separator"></div>
        <div class="log-header__item">
          <div class="type-statistics">
            <div class="type-statistics__item">
              <span><exclamation-circle-outlined /></span>
              <span>{{ logStore.logData.totalErrorCount }} Errors</span>
            </div>
            <div class="type-statistics__item">
              <span><warning-outlined /></span>
              <span>{{ logStore.logData.totalWarningCount }} Warnings</span>
            </div>
          </div>
        </div>

        <div class="log-header__separator"></div>
        <div class="log-header__item">
          <a-select
            v-if="false"
            v-model:value="checkedList"
            mode="multiple"
            style="width: 100px"
            placeholder="Filter log"
            :options="logTypeList"
            @change="handleChange"
            :maxTagCount="0"
            :maxTagPlaceholder="handleTagPlaceholder"
            :show-search="false"
          ></a-select>
          <a-checkbox-group
            @change="handleChange"
            v-model:value="checkedList"
            :options="logTypeList"
            :disabled="true"
          />
        </div>
        <div class="log-header__separator"></div>

        <div class="log-header__item">
          <copy-outlined />
        </div>
        <!-- <div class="log-header__item">選單</div> -->
        <div class="log-header__item" @click="closeLog">
          <close-outlined />
        </div>
      </div>
    </div>
    <div class="empty-console-list" v-if="!logStore.logData.logList.length">
      <div class="empty-console-list__content">
        <p class="empty-console-list__bold-text">No logs yet</p>
        <p>Send a request to view its details in the console.</p>
      </div>
    </div>
    <div class="console-list console-list--is-pretty" v-else>
      <a-collapse v-model:activeKey="activeKey" :bordered="false">
        <template #expandIcon>
          <caret-right-outlined :style="{ fontSize: '11px', color: '#333' }" />
        </template>
        <a-collapse-panel
          v-for="log in logStore.logData.logList"
          :key="log.id"
          :class="[setBackgroundColor(log.logType)]"
        >
          <template #header>
            <!-- <span v-if='isShowIcon(log.logType)'><exclamation-circle-outlined /></span>
            <span v-if='isShowIcon(log.logType)'><warning-outlined /></span> -->
            <span class="timestamps">{{ log.timestamps }}</span>
            <span class="network">{{ log.method }} {{ log.url }}"</span>
          </template>
          <template #extra>
            <div class="console-list__response-meta">
              <span class="console-list__response-code">{{ log.status }}</span>
              <div class="separator"></div>
              <span class="console-list__response-time"
                >{{ log.responseMeta.time }} ms</span
              >
              <p
                class="console-list__change-log-type"
                @click.stop="changeLogType(log)"
              >
                Show raw log
              </p>
            </div>
          </template>
          <a-collapse :bordered="false">
            <template #expandIcon>
              <caret-right-outlined
                :style="{ fontSize: '11px', color: '#333' }"
              />
            </template>
            <div class="console-list__raw-content" v-if="log.isShowRawLog">
              <p
                v-html="log.rawLog.requestHeader"
                style="white-space: break-spaces"
              ></p>
              <p
                v-if="log.streamText"
                v-html="log.streamText"
                style="white-space: break-spaces"
                class="console-list__row"
              ></p>
              <div class="console-list__row">
                <div v-for="(v1, k1) in log.rawLog.responseHeader" :key="k1">
                  <span style="text-transform: capitalize">{{ k1 }} </span>
                  <span>：</span>
                  <span>{{ v1 }}</span>
                </div>
              </div>
              <p style="word-break: break-all">{{ log.rawLog.responseBody }}</p>
            </div>
            <!-- <div v-else> -->
            <a-collapse-panel
              v-else
              :class="[setBackgroundColor(log.logType)]"
              :header="handleHeader(k1)"
              v-for="(v1, k1) in log.subObj"
              :key="k1"
            >
              <div class="console-list__sub-list">
                <div v-if="typeof v1 === 'string'">{{ v1 }}</div>
                <div v-else>
                  <p v-for="(v2, k2) in v1" :key="k2">
                    <span class="console-list__sub-list-key">{{ k2 }}</span>
                    <span>：</span>
                    <span class="console-list__sub-list-value">{{
                      v2 ? v2 : "null"
                    }}</span>
                  </p>
                </div>
              </div>
            </a-collapse-panel>
            <!-- </div> -->
          </a-collapse>
        </a-collapse-panel>
      </a-collapse>
    </div>
    <!-- 添加 HTML 元素来显示日志内容 -->
    <pre>{{ logContent }}</pre>

    <!-- 添加用户界面来切换显示原始或美化的日志 -->
    <!-- <label>
      <input type="radio" v-model="logType" value="raw" /> 原始日志
    </label>
    <label>
      <input type="radio" v-model="logType" value="pretty" /> 美化日志
    </label> -->
  </div>
</template>

<script>
import {
  ref,
  reactive,
  onMounted,
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  watch,
} from "vue";
import Helper from "@/js/utils/helper";
import logStore from "@/store/logData";

export default {
  emits: {
    "close-log": null,
  },
  setup(props, context) {
    const logContent = ref(""); // 存储日志内容
    const logType = ref("raw"); // 默认显示原始日志

    const electron = window.require("electron");
    const { ipcRenderer } = electron;

    onMounted(() => {
      setTimeout(() => {
        // Helper.getLogContent();
      }, 2000);
    });
    // 读取日志文件的内容
    watch(logType, () => {
      if (newType === "pretty") {
        // 在这里实现美化日志的逻辑，例如 JSON.stringify
        // 这里只是示例，实际实现会根据你的需求而不同
        // this.logContent = JSON.stringify(JSON.parse(this.logContent), null, 2);
      } else {
        // 显示原始日志
        // this.logContent = this.logContent;
      }
    });

    const activeKey = ref([]);
    const subActiveKey = ref([]);

    const handleHeader = (key) => {
      let headerName = "";

      while (!headerName) {
        switch (key) {
          case "requestHeaders":
            headerName = "Request Headers";
            break;
          case "requestBody":
            headerName = "Request Body";
            break;
          case "responseHeaders":
            headerName = "Response Headers";
            break;
          case "responseBody":
            headerName = "Response Body";
            break;
          default:
            break;
        }
      }

      return headerName;
    };

    const logTypeList = ref([
      {
        label: "Log",
        type: "log",
        value: "log",
      },
      {
        label: "Info",
        type: "info",
        value: "info",
      },
      {
        label: "Warning",
        type: "warn",
        value: "warn",
      },
      {
        label: "Error",
        type: "error",
        value: "error",
      },
      {
        label: "Network",
        type: "network",
        value: "network",
      },
    ]);

    const value = ref([]);

    const filterType = ref("");

    const filterText = ref("");

    const checkedList = ref(["log", "info", "warn", "error", "network"]);

    const handleChange = (value) => {
      // console.log("handleChange value__", value);
      filterType.value = value;
    };

    const logSelector = ref();
    const handleTagPlaceholder = (omittedValues) => {
      if (omittedValues.length === logTypeList.value.length) {
        return "All logs";
      } else {
        return "Custom";
      }
    };

    const closeLog = () => {
      context.emit("close-log");
    };

    const setBackgroundColor = (typeList) => {
      const isError = (type) => type === "error";
      const isWarn = (type) => type === "warn";

      if (typeList.some(isError)) return "is-error";
      if (typeList.some(isWarn)) return "is-warn";
      return "is-log";
    };

    const isShowIcon = (typeList) => {
      const isError = (type) => type === "error";
      const isWarn = (type) => type === "warn";
      if (typeList.some(isError)) return true;
      if (typeList.some(isWarn)) return true;
      return false;
    };

    // const getLogContent = () => {
    //   console.log("triggere");
    //   // 发送请求获取日志的事件给主进程
    //   ipcRenderer.send("get-log");

    //   // 监听主进程返回的日志内容
    //   ipcRenderer.once("log-content", (event, logContent) => {
    //     // 在这里处理日志内容，可以将其显示在渲染进程的界面上
    //     console.log("Log Content:", logContent);
    //   });
    // };

    // 监听主进程返回的日志内容
    ipcRenderer.on("log-content", (event, logContent) => {
      // 在这里处理日志内容，可以将其显示在渲染进程的界面上
      // console.log("Log Content:", logContent);
    });

    const changeLogType = (log) => {
      log.isShowRawLog = !log.isShowRawLog;
    };

    return {
      logContent,
      logType,
      logStore,
      activeKey,
      subActiveKey,
      handleHeader,
      logTypeList,
      filterText,
      filterType,
      handleChange,
      logSelector,
      checkedList,
      value,
      handleTagPlaceholder,
      closeLog,
      setBackgroundColor,
      isShowIcon,
      changeLogType,
    };
  },
};
</script>
<style lang="scss" scoped>
.log-wrapper {
  position: absolute;
  bottom: 30px;
  left: 0;
  z-index: 9;
  width: 100%;
  height: 40%;
  background-color: #ffffff;
  // background-color: #5b5b5b;
  overflow: scroll;
  padding: 10px;
  border-top: 1px solid #5b5b5b;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  &__title {
    font-weight: 700;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  &__item {
    cursor: pointer;
    .ant-btn {
      padding: 0 16px;
      height: 100%;
    }
  }

  &__separator {
    // margin: 0 8px;
    width: 1px;
    height: 11px;
    background-color: #5b5b5b;
  }
}

.empty-console-list {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 24px - 20px); // 扣掉 header 及上下padding
  text-align: center;

  &__bold-text {
    margin-bottom: 16px;
    font-weight: 700;
  }
}

.console-list {
  &__sub-list {
    padding: 0 30px;
  }

  &__sub-list-value {
    color: $dark-blue;
  }

  &__response-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    text-align: right;
    color: $request-color-get;
  }

  &__change-log-type {
    position: relative;
    z-index: 10;
    flex-basis: 100%;
    color: $primary-blue;
    cursor: pointer;
  }

  &__row {
    margin-bottom: 20px;
  }

  &__raw-content {
    padding: 4px 16px 4px 34px;
  }
}

.separator {
  margin: 0 8px;
  width: 1px;
  height: 11px;
  background-color: #ededed;
}

.type-statistics {
  display: flex;
  align-items: center;
  gap: 10px;

  span {
    font-size: 12px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.timestamps {
  display: inline-block;
  width: 90px;
  // padding-right: 10px;
  padding-left: 10px;
  color: $text-grey;
  font-weight: 700;
  font-size: $text-size-s;
}

.is-error {
  background-color: #ffecec;
}

.is-warn {
  background-color: #fff8d7;
}
</style>

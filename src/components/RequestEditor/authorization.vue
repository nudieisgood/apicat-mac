<template>
  <div class="authorization">
    <div class="authorization__box">
      <div class="authorization__row">
        <p class="authorization__label">Type</p>
        <a-select
          ref="select"
          :value="tabInfo.request.auth.type"
          :options="
            authTypeList.map((e) => ({
              label: e.charAt(0).toUpperCase() + e.slice(1),
              value: e,
            }))
          "
          @change="handleChange"
        />
      </div>
    </div>
    <div class="authorization__box">
      <div
        class="authorization__row"
        v-if="tabInfo.request.auth.type === AuthTypeEnum.BEARER"
      >
        <p class="authorization__label">Token</p>
        <a-input
          v-model:value="tokenVal"
          @blur="addBearerToken"
          @input="handleInput"
        />
        <!-- 先不透過 @blur 觸發auth相關事件-->
        <!-- <a-input
          v-model:value="tokenVal"
          @blur="addBearerToken"
          @input="handleInput"
        /> -->
      </div>
      <div
        class="authorization__row"
        v-else-if="tabInfo.request.auth.type === AuthTypeEnum.INHERIT"
      >
        <p>
          This request is using Bearer Token from
          <span class="inherit-name">{{
            tabsData.inheritedScope.inheritedInfo?.name
          }}</span>
        </p>
      </div>
      <div class="authorization__row" v-else>
        <p>This request does not use any authorization.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, toRefs, onMounted, onBeforeMount, computed } from "vue";
import tabsData from "@/store/tabs";
import requestData from "@/store/requestData";
import AuthTypeEnum, { authTypeList } from "@/js/enum/authTypeEnum";
import workspaceData from "@/store/workspace";
import store from "@/store";

export default {
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  setup(props) {
    const { tabInfo } = toRefs(props);
    const tokenVal = ref("");

    const handleChange = (authType) => {
      /* 若tokenVal沒有值時或選擇'No auth'，Header移除Authorization欄位 */
      if (authType === AuthTypeEnum.NOAUTH) {
        tabsData.clearAuthorization(tabInfo.value);
      } else if (authType === AuthTypeEnum.BEARER) {
        addBearerToken();
      } else if (authType === AuthTypeEnum.INHERIT) {
        tabsData.getParentData(tabInfo.value.parentId);
        tabsData.useAndSetParentAuth(tabInfo.value);
        tabsData.updateAuthorization(AuthTypeEnum.INHERIT, tabInfo.value);
      }
      tabInfo.value.request.auth.type = authType;
      // tabInfo.value.isEditing = true // 此為tab的編輯狀態
    };

    const addBearerToken = () => {
      if (!tokenVal.value) {
        tabsData.clearAuthorization(
          tabInfo.value,
          tabInfo.value.request.auth.type
        );
        return;
      }
      tabsData.setAuthorization(
        AuthTypeEnum.BEARER,
        tokenVal.value,
        tabInfo.value
      );
    };

    const selectedEnvironmentId = computed(() => {
      return store.getters.getSelectedEnvironmentId;
    });

    // 若auth type 為 bearer且有用到環境變數，切換環境時，可能會影響token的值
    watch(
      () => selectedEnvironmentId.value,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          if (tabInfo.value.request.auth.type === AuthTypeEnum.BEARER) {
            addBearerToken();
          }
        }
      }
    );

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    // 若auth type 為 bearer且有用到global變數，global變數有變動時，可能會影響token的值
    watch(
      () => currentWorkspace.value.variable,
      () => {
        if (tabInfo.value.request.auth.type === AuthTypeEnum.BEARER) {
          addBearerToken();
        }
      },
      {
        // deep: true
      }
    );

    const variablesState = computed(() => {
      return store.getters.getVariablesState;
    });

    // 若auth type 為 bearer且有用到collection變數，collection變數有變動時，可能會影響token的值
    watch(
      () => variablesState.value.collectionVariable,
      () => {
        if (tabInfo.value.request.auth.type === AuthTypeEnum.BEARER) {
          addBearerToken();
        }
      },
      {
        // deep: true
      }
    );

    onBeforeMount(() => {
      // handleChange(tabInfo.value.request.auth.type)
    });

    onMounted(() => {
      if (tabInfo.value.request.auth.type === AuthTypeEnum.BEARER) {
        if (tabInfo.value.request.auth[AuthTypeEnum.BEARER]) {
          if (tabInfo.value.request.auth[AuthTypeEnum.BEARER].length === 0) {
            tokenVal.value = "";
          } else {
            tokenVal.value =
              tabInfo.value.request.auth[AuthTypeEnum.BEARER][0].value;
          }
        } else {
          tokenVal.value = "";
        }
      }
    });

    const handleInput = () => {
      if (tabInfo.value.request.auth.type === AuthTypeEnum.BEARER) {
        if (tokenVal.value) {
          tabInfo.value.request.auth = {
            type: "bearer",
            bearer: [{ key: "token", value: tokenVal.value, type: "string" }],
          };
        } else {
          tabInfo.value.request.auth = {
            type: "bearer",
            bearer: [],
          };
        }
      }
      addBearerToken();
    };

    return {
      authTypeList,
      tokenVal,
      addBearerToken,
      handleChange,
      tabsData,
      AuthTypeEnum,
      requestData,
      handleInput,
    };
  },
};
</script>

<style scoped lang="scss">
.authorization {
  display: flex;
  color: $text-grey;

  &__label {
    font-weight: 500;
  }

  &__box {
    padding: 20px 20px;
    flex-basis: 30%;
    min-height: 250px;
  }

  &__box:nth-child(1) {
    //flex-basis: 25%;
    border-right: 1px solid #eaeaea;

    .ant-select {
      flex-basis: 45%;
      margin-left: auto;
    }

    .ant-select-selector {
      background-color: #f2f2f2;
    }
  }

  &__box:nth-child(2) {
    //flex-basis: 75%;
    flex: 1;

    .authorization__row {
      width: 40%;
    }

    .ant-input {
      flex-basis: 55%;
      //margin-left: 100px;
      width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
      margin-bottom: 0;
    }
  }

  .ant-input-group.ant-input-group-compact {
    display: flex;
    margin-left: 20px;
  }
}

.inherit-name {
  font-weight: 500;
  text-decoration: underline;
}
</style>

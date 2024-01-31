<template>
  <!-- collection / folder 類型的 authorization 介面-->
  <div class="authorization-block-wrapper">
    <div class="authorization-block">
      <div class="authorization-block__header">
        <p>
          This authorization method will be used for every request in this
          {{ tabInfo.tabType }}. You can override this by specifying one in the
          request.
        </p>
      </div>
      <div class="authorization-block__content">
        <div class="authorization-selector">
          <div class="authorization-selector__label">Type</div>
          <div class="authorization-selector__select">
            <a-select
              ref="select"
              :value="tabInfo.auth.type"
              :options="
                authTypeOptions.map((e) => ({
                  label: e.charAt(0).toUpperCase() + e.slice(1),
                  value: e,
                }))
              "
              @change="handleChange"
            />
          </div>
          <div class="authorization-selector__mark">
            The authorization header will be automatically generated when you
            send the request.
          </div>
        </div>
        <div class="divider"></div>
        <div class="auth-type-editor">
          <!-- Bearer Token -->
          <div
            class="bearer-token-container"
            v-if="tabInfo.auth.type === AuthTypeEnum.BEARER"
          >
            <div class="api-key-container__row row">
              <div class="api-key-container__label row__label">Token</div>
              <div class="api-key-container__select row__select">
                <a-input
                  placeholder="Token"
                  v-model:value="bearerToken"
                  @input="handleInput"
                />
              </div>
            </div>
          </div>
          <!-- Inherit -->
          <div
            class="authorization__row"
            v-else-if="tabInfo.auth.type === AuthTypeEnum.INHERIT"
          >
            <p>
              This folder is using Bearer Token from
              <span class="inherit-name">{{
                tabsData.inheritedScope.inheritedInfo?.name
              }}</span>
            </p>
          </div>

          <!-- No Auth -->
          <div class="no-auth-container" v-else>
            <p class="message">
              This {{ tabInfo.tabType }} does not use any authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, reactive, toRefs, onMounted, computed } from "vue";
import workspaceData from "@/store/workspace";
import requestData from "@/store/requestData";
import tabsData from "@/store/tabs";
import AuthTypeEnum, { authTypeList } from "@/js/enum/authTypeEnum";
import TypeEnum from "@/js/enum/typeEnum.js";

export default {
  name: "authorizationBlock",
  components: {},
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "update-auth-type": null,
    "update-bearer-token": null,
  },
  setup(props, context) {
    const { tabInfo } = toRefs(props);

    const authTypeOptions = computed(() => {
      if (tabInfo.value.tabType === TypeEnum.collection.name) {
        return authTypeList.filter((e) => e !== AuthTypeEnum.INHERIT);
      }
      return authTypeList;
    });

    const handleChange = (authType) => {
      /* 若tokenVal沒有值時或選擇'No auth'，Header移除Authorization欄位 */
      if (authType === AuthTypeEnum.NOAUTH) {
        tabsData.clearAuthorization(tabInfo.value);
        bearerToken.value = "";
      } else if (authType === AuthTypeEnum.BEARER) {
        addBearerToken();
      } else if (authType === AuthTypeEnum.INHERIT) {
        tabsData.getParentData(tabInfo.value.parentId);
        tabsData.updateAuthorization(AuthTypeEnum.INHERIT, tabInfo.value);
      }
      context.emit("update-auth-type", authType);
      tabInfo.value.auth.type = authType;
    };

    const basicAuthState = reactive({
      username: "",
      password: "",
    });

    const bearerToken = ref(undefined);

    const apiKeyState = reactive({
      key: "",
      value: "",
      selectedVal: "header",
    });

    const addBearerToken = () => {
      /* 若tokenVal沒有值時，Header移除Authorization欄位 */
      if (!bearerToken.value) {
        tabsData.clearAuthorization(tabInfo.value, tabInfo.value.auth.type);
        return;
      }
      tabsData.setAuthorization(
        AuthTypeEnum.BEARER,
        bearerToken.value,
        tabInfo.value
      );
    };

    const handleInput = ($event) => {
      context.emit("update-bearer-token", $event.target.value);
      addBearerToken();
    };

    // NOTE: 2023/11/30 原 folder 類型有寫這段但 collection 沒有，先註解
    // watch(
    //   () => workspaceData.workspace.workspaceId,
    //   () => {
    //     if (tabInfo.value.type === AuthTypeEnum.BEARER) {
    //       addBearerToken();
    //     }
    //   },
    //   {
    //     // deep: true
    //   }
    // );

    onMounted(() => {
      if (tabInfo.value.auth.type === AuthTypeEnum.BEARER) {
        if (tabInfo.value.auth[AuthTypeEnum.BEARER]) {
          if (tabInfo.value.auth[AuthTypeEnum.BEARER].length === 0) {
            bearerToken.value = "";
          } else {
            bearerToken.value =
              tabInfo.value.auth[AuthTypeEnum.BEARER][0].value;
          }
        } else {
          bearerToken.value = "";
        }
      }
    });

    return {
      basicAuthState,
      bearerToken,
      apiKeyState,
      handleChange,
      requestData,
      tabsData,
      addBearerToken,
      AuthTypeEnum,
      authTypeList,
      handleInput,
      authTypeOptions,
    };
  },
};
</script>
<style lang="scss" scoped>
.authorization-block {
  font-size: $text-size-m;
  margin-left: 20px;
  margin-right: 20px;
  color: $text-grey;

  &__header {
    margin-bottom: 32px;
  }

  &__content {
    max-width: 550px;
  }

  .ant-select {
    width: 100%;
  }
}

.authorization-selector {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;

  &__select {
    flex-basis: 35%;
  }

  &__mark {
    flex-basis: 100%;
    margin-top: 28px;
  }

  &__label {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.divider {
  margin: 20px 0;
  width: 100%;
  height: 1px;
  background-color: $primary-dark-grey;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  &__input,
  &__select {
    flex-basis: 35%;
  }
}
</style>

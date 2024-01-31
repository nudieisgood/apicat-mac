<template>
  <div class="cookies-modal">
    <a-modal
      v-model:open="visible"
      title="MANAGE COOKIES"
      class="cookies-modal"
      width="750px"
      @cancel="closeDialog"
    >
      <div class="modal__header">
        <a-input placeholder="Type a domain name" v-model:value="domain" />
        <a-button class="btn-add" @click="addDomain">Add</a-button>
      </div>
      <div class="modal__content">
        <div class="list" v-if="cookiesDB.length > 0">
          <a-collapse
            v-model:activeKey="activeKey"
            @change="handleCollapseChange"
            accordion
          >
            <a-collapse-panel
              :header="`${item.domain}&emsp;${
                item.cookies ? item.cookies.length : 0
              } cookie`"
              v-for="(item, index) in cookiesDB"
              :key="index"
              :show-arrow="false"
            >
              <div class="list__content">
                <div class="list__create-header">
                  <div class="list__tag-box">
                    <div class="list__tag" v-if="item.cookies">
                      <a-tag
                        closable
                        @close="removeCookie(item, tag)"
                        @click="showCookiesContent(index, item)"
                        v-for="(tag, index) in item.cookies"
                        :key="index"
                        :class="{ 'tag-checked': selectedTagIndex === index }"
                        >{{ handleTagName(tag) }}</a-tag
                      >
                      <a-button
                        class="btn-add"
                        @click="addCookie(item)"
                        type="text"
                        >+Add Cookie</a-button
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="list__create-content"
                  v-if="
                    item.cookies &&
                    (item.cookies[selectedTagIndex] ||
                      item.cookies[selectedTagIndex] === '')
                  "
                >
                  <a-textarea
                    v-model:value="item.cookies[selectedTagIndex]"
                    :rows="4"
                  />
                  <div class="list__btns">
                    <a-button class="btn-cancel" @click="cancel"
                      >Cancel</a-button
                    >
                    <a-button class="btn-save" @click="saveCookies(item)"
                      >Save</a-button
                    >
                  </div>
                </div>
              </div>
              <template #extra
                ><close-outlined
                  class="collapse-close"
                  @click.stop="removeDomain(index, item)"
              /></template>
            </a-collapse-panel>
          </a-collapse>
        </div>
        <div v-else class="list--empty">
          <p>No Cookies available</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { onMounted, ref, watch, toRefs, computed } from "vue";
import {
  createCookiesDomain,
  getCookiesDomains,
  removeCookiesDomain,
  updateCookiesDomain,
} from "@/js/ipc/cookiesIPC.js";
import cookieStore from "@/store/cookie.js";
import store from "@/store";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-cookies-dialog": null,
  },
  components: {},
  setup(props, context) {
    const { dialogVisible } = toRefs(props);
    const activeKey = ref("");
    const selectedTagIndex = ref(null);
    const domain = ref("");

    // NOTE: 20231201 改從共用資料區取 cookie 清單
    const cookiesDB = computed(() => {
      return store.getters.getCookieData;
    });

    const addDomain = () => {
      const obj = {};
      if (domain.value) {
        if (cookiesDB.value.find((e) => e.domain === domain.value)) {
          domain.value = "";
          return;
        }
        obj.domain = domain.value;
        obj.cookies = [];
        activeKey.value = String(cookiesDB.value.length);
        createCookiesDomain(obj);
      }
      domain.value = "";
    };

    const handleCollapseChange = (key) => {
      selectedTagIndex.value = null;
    };

    const initVal = ref(0);
    const addCookie = (currentDomain) => {
      let serialNum = null;
      if (cookieStore.cookiesConfig.initVal !== 0) {
        cookieStore.cookiesConfig.initVal += 1;
        serialNum = cookieStore.cookiesConfig.initVal;
      } else {
        initVal.value += 1;
        serialNum = initVal.value;
      }

      currentDomain.cookies.push(
        `Cookie_${serialNum}=value; Path=/; Expires=${new Date()};`
      );
      selectedTagIndex.value = currentDomain.cookies.length - 1;
      updateCookiesDomain(currentDomain);
    };

    // 處理cookies tag 名稱顯示
    const handleTagName = (tag) => {
      const splitArr = tag.split("=");
      return splitArr[0];
    };

    // 顯示該cookies tag的內容
    const showCookiesContent = (index, domain) => {
      // console.log(index, domain)
      selectedTagIndex.value = index;
    };

    const saveCookies = (domainData) => {
      /**
       * 於彈窗內新增/編輯cookie內容時，若與其他cookie的cookie-name及path相同時，以最新新增/編輯的cookie為主，舊的移除
       */

      if (domainData.cookies && domainData.cookies.length > 0) {
        const pathReg = /path=(.*?);/i;
        const nameReg = /([^=]+)=/i;
        for (let i = 0; i < domainData.cookies.length; i++) {
          const path = domainData.cookies[i].match(pathReg)[1];
          const name = domainData.cookies[i].match(nameReg)[1];
          for (let k = i + 1; k < domainData.cookies.length; k++) {
            const _path = domainData.cookies[k].match(pathReg)[1];
            const _name = domainData.cookies[k].match(nameReg)[1];
            if (path === _path && name === _name) {
              if (i === selectedTagIndex.value) {
                domainData.cookies.splice(k, 1);
              } else {
                domainData.cookies.splice(i, 1);
              }
            }
          }
        }
      }
      updateCookiesDomain(domainData);
      selectedTagIndex.value = null;
      getCookiesDomains();
      cookieStore.cookiesConfig.isUpdated = true;
    };
    const cancel = (e) => {
      selectedTagIndex.value = null;
      cookieStore.cookiesConfig.isUpdated = false;
      getCookiesDomains();
    };
    const removeCookie = (currentDomain, tag) => {
      const delIndex = currentDomain.cookies.findIndex((e) => e === tag);
      if (delIndex !== -1) {
        currentDomain.cookies.splice(delIndex, 1);
      }
      updateCookiesDomain(currentDomain);
      cookieStore.cookiesConfig.isUpdated = true;
    };
    const removeDomain = (index, data) => {
      removeCookiesDomain(data);
      getCookiesDomains();
      openNotificationWithIcon("success", data.domain);
    };

    // 右下方出現提示訊息
    const openNotificationWithIcon = (type, domainName) => {
      window.showNotification(
        type,
        `Cookies for domain ${domainName} deleted successfully.`
      );
    };

    // 彈窗顯示與否
    const visible = ref(false);
    const closeDialog = () => {
      // 關閉彈窗後紀錄最後一個流水號，用於新增cookies tag 文字顯示
      cookieStore.cookiesConfig.initVal = initVal.value;
      visible.value = false;
      cookieStore.cookiesConfig.isUpdated = false;
      activeKey.value = "";
      context.emit("close-cookies-dialog");
    };

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {
      getCookiesDomains();
    });

    return {
      activeKey,
      domain,
      visible,
      selectedTagIndex,
      addDomain,
      closeDialog,
      removeDomain,
      removeCookie,
      addCookie,
      saveCookies,
      cancel,
      handleTagName,
      showCookiesContent,
      handleCollapseChange,
      cookiesDB,
    };
  },
};
</script>
<style lang="scss" scoped>
$headerHeight: 32px;

.modal {
  &__header {
    display: flex;
    align-items: center;
    height: $headerHeight;
    margin-right: 7px;
    margin-bottom: 20px;

    .ant-input {
      background-color: #f9f9f9;
    }

    .btn-add {
      height: 26px;
      margin-left: 20px;
      padding: 0 15px;
    }
  }

  &__content {
    height: calc(100% - $headerHeight);
    max-height: 340px;
    margin-bottom: 20px;
    overflow-y: scroll;
    // padding-right: 7px;
  }
}

.list {
  &--empty {
    height: 100%;
    position: relative;

    p {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      margin-bottom: 0;
    }
  }

  &__name {
    margin-right: 15px;
  }

  &__create-header {
    margin: 10px 0;
  }

  .ant-tag {
    // margin-right: 16px;
    // margin-bottom: 8px;
    padding: 6px 15px;
    cursor: pointer;
    border: 0px solid #d0d0d0;
    border-radius: 3px;
    color: #333;
    background: #ffffff;
    // background: #EDEDED;
    display: flex;
    align-items: center;
    font-size: 12px;

    &:hover {
      transform: scale(1.05);
    }

    .ant-tag-close-icon {
      margin-left: 12px;
    }

    // &:hover {
    //   background: #7B7B7B;
    //   color: #ffffff;
    // }
  }

  // .ant-tag-checkable:hover {
  //   background: #D0D0D0;
  //   color: #333;
  // }

  // &__cookie-tags {
  //   .ant-tag {
  //     margin-bottom: 8px;
  //     padding: 5px 8px;
  //     cursor: pointer;
  //   }

  //   .ant-tag-checkable:hover {
  //     background: #D0D0D0;
  //   }
  // }

  .ant-collapse {
    background-color: transparent;
    border: unset;
  }

  .ant-collapse-item {
    border: 1px solid transparent;
    background-color: #ededed;
    border-radius: 3px;

    &:not(:last-child) {
      margin-bottom: 16px;
    }
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 8px 16px;
    flex-wrap: wrap;
  }

  .tag-checked {
    background: #ededed;
    // background: #ffffff;
    // color: #ffffff;

    &:hover {
      transform: scale(1);
    }
  }

  .collapse-close {
    z-index: 5;
    padding: 0 8px;
  }

  &__btns {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;

    .ant-btn {
      margin-left: 10px;
    }

    .btn-cancel {
      background: $primary-white;
      // color: #0066CC;
      // border: unset;
    }
  }
}
</style>

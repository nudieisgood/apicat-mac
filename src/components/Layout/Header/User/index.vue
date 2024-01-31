<template>
  <div class="user-info">
    <a-dropdown
      :trigger="['click']"
      overlayClassName="user-info-dropdown"
      v-model:open="userInfoDownVisible"
    >
      <a class="ant-dropdown-link" @click.prevent>
        <img
          :src="require('@/assets/img/header/icon-user.svg')"
          alt="icon-user"
          class="ant-dropdown-link__icon-user"
        />
        <img
          :src="require('@/assets/img/header/icon-user-hover.svg')"
          alt="icon-user-hover"
          class="ant-dropdown-link__icon-user-hover"
        />
      </a>
      <template #overlay>
        <a-menu>
          <div class="user-card">
            <div class="user-card__left">
              <div class="user-card__left-avatar">
                <img
                  :src="require('@/assets/img/header/icon-user.svg')"
                  alt=""
                />
              </div>
            </div>
            <div class="user-card__right">
              <div class="user-card__right-name" v-text="userState.userName" />
              <div
                class="user-card__right-account"
                v-text="userState.account"
              />
            </div>
          </div>
          <a-menu-divider />
          <div class="user-options">
            <a @click="showSettingDialog" class="user-options__settings"
              >Settings</a
            >
            <a @click="logout" class="user-options__logout">Logout</a>
          </div>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
  <profile-setting
    v-if="isShowSettingDialog"
    :dialogVisible="isShowSettingDialog"
    @close-setting-dialog="isShowSettingDialog = !isShowSettingDialog"
  />
</template>

<script>
import { onMounted, ref, computed, inject } from "vue";
import { useRouter } from "vue-router";
import { ipcLogoutRequest } from "@/js/ipc/userIPC.js";
import { useStore } from "vuex";
import ProfileSetting from "@/components/Layout/Header/User/profileSetting";

export default {
  name: "User",
  components: {
    ProfileSetting,
  },
  setup() {
    const store = useStore();
    const $message = inject("$message");
    const router = useRouter();

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    const logout = async () => {
      const obj = {
        Authorization: `Bearer ${userState.value.token}`,
      };
      store.commit("SET_SHOW_LAYOUT_LOADING_MODE", true);
      const res = await ipcLogoutRequest(obj);

      if (res.code === 20000) {
        router.push("/");
      } else if (res.code === 40011) {
        $message.warning(res.message);
        router.push("/");
      } else {
        $message.warning(res.message);
      }
    };

    const isShowSettingDialog = ref(false);
    const userInfoDownVisible = ref(false);

    const showSettingDialog = () => {
      isShowSettingDialog.value = true;
      userInfoDownVisible.value = false;
    };

    onMounted(() => {});

    return {
      logout,
      isShowSettingDialog,
      userInfoDownVisible,
      showSettingDialog,
      userState,
    };
  },
};
</script>
<style lang="scss" scoped>
.ant-dropdown-link {
  position: relative;
  width: 24px;
  height: 24px;
  display: block;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__icon-user {
    opacity: 1;
  }

  &__icon-user-hover {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  &:hover {
    .ant-dropdown-link__icon-user {
      opacity: 0;
    }

    .ant-dropdown-link__icon-user-hover {
      opacity: 1;
    }
  }
}

.user-card {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 12px;

  &__left {
    max-width: 30px;
    // width: 25px;
    // height: 25px;
    margin-right: 15px;
  }

  &__left-avatar {
    width: 100%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__right {
    // flex-basis: 87%;
    max-width: 160px;
    font-size: $text-size-l;
  }

  &__right-name {
    margin-bottom: 5px;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &__right-account {
    // margin-bottom: 5px;
    color: #7b7b7b;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.ant-dropdown-menu-title-content {
  a {
    font-weight: 500;
    font-size: 13px;
    color: #333;
    line-height: 16px;
  }
}

.user-options {
  padding: 5px 12px;

  a {
    display: block;
    // color: #906170;
    color: #333;
    font-weight: 500;
    font-size: $text-size-l;

    &:not(:last-child) {
      margin-bottom: 4px;
    }

    &.user-options__logout {
      color: #906170;
    }
  }
}
</style>

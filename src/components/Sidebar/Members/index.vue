<template>
  <div class="member-list-wrapper">
    <div class="member-list-operation">
      <action-menu
        @create="isShowInviteDialog = true"
        @search="onSearch"
        :current-tab-name="'Members'"
      />
    </div>

    <div
      class="member-list"
      v-if="state.participantList && state.participantList.length > 0"
    >
      <li
        :key="user.userId"
        v-for="user in state.participantList"
        class="member-list__item"
      >
        <div class="member-list__item-info" v-if="user.status === 1">
          <div
            class="member-list__item-details"
            :class="{ 'current-user-info': checkIsCurrentUser(user) }"
          >
            <div class="user-name">
              <span
                >{{ checkIsCurrentUser(user) ? "You" : user.userName }}
              </span>
              <!-- 若有編輯權(為管理者)，顯示星星 -->
              <span class="icon-star" v-if="user.editable" />
            </div>
            <span>{{ user.account }} </span>
          </div>
          <!-- 帳號不為自己且自己擁有編輯權時，顯示刪除及編輯 -->
          <div class="actions" v-if="!checkIsCurrentUser(user) && isEditable">
            <!-- 刪除按鈕顯示時機：沒有編輯權且非當前 workspace 建立者-->
            <span
              class="actions__item"
              @click.stop="openTipDialog(user)"
              v-if="!user.editable && !user.owner"
            >
              <span class="icon-delete" />
            </span>
            <span class="actions__item" @click.stop="openEditDialog(user)">
              <span class="icon-edit" />
            </span>
          </div>
        </div>
      </li>
    </div>
    <div v-else class="empty-block-wrapper">
      <div class="empty-block">
        <p v-if="showTip" class="tip-text">No results found</p>
        <div v-else class="empty-block__header">No Members</div>
      </div>
    </div>
  </div>

  <invite-dialog
    v-if="isShowInviteDialog"
    :dialogVisible="isShowInviteDialog"
    @close-invite-dialog="hideInviteDialog"
    @update-participant-list="getParticipantList"
    :participant-list="state.participantList"
  />
  <edit-dialog
    v-if="isShowEditDialog"
    :dialogVisible="isShowEditDialog"
    @close-edit-dialog="hideEditDialog"
    :user-info="selectedUserInfo"
    @update-participant-list="getParticipantList"
  />
  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="hideTipDialog"
    :user-info="selectedUserInfo"
    @update-participant-list="getParticipantList"
  />
</template>

<script>
import { ref, onMounted, reactive, watch, computed } from "vue";
import InviteDialog from "@/components/Sidebar/Members/inviteDialog.vue";
import EditDialog from "@/components/Sidebar/Members/editDialog.vue";
import TipDialog from "@/components/Sidebar/Members/tipDialog.vue";
import workspaceData from "@/store/workspace";
import ActionMenu from "@/components/Sidebar/actionMenu.vue";
import store from "@/store";

export default {
  components: {
    InviteDialog,
    EditDialog,
    TipDialog,
    ActionMenu,
  },
  setup() {
    // const app = getCurrentInstance()
    const state = reactive({
      participantList: [],
      originalParticipantList: [],
    });

    const selectedId = ref(null);
    // 建立 member 相關參數及func
    const isShowInviteDialog = ref(false);

    const hideInviteDialog = () => {
      isShowInviteDialog.value = false;
    };

    // 編輯 member 相關參數及func
    const isShowEditDialog = ref(false);

    const selectedUserInfo = ref({});

    const openEditDialog = (userInfo) => {
      selectedUserInfo.value = userInfo;
      isShowEditDialog.value = true;
    };
    const hideEditDialog = () => {
      isShowEditDialog.value = false;
    };

    // 刪除 member 相關參數及func
    const isShowTipDialog = ref(false);

    const openTipDialog = (user) => {
      selectedUserInfo.value = user;
      isShowTipDialog.value = true;
    };
    const hideTipDialog = () => {
      isShowTipDialog.value = false;
    };

    const getParticipantList = async () => {
      await workspaceData.getParticipantList();
    };

    const handleParticipantList = async (list) => {
      list.sort((x, y) => checkIsCurrentUser(y) - checkIsCurrentUser(x)); // 當前使用者放第一順位

      return list;
    };

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    // 判斷是否為當前使用者
    const checkIsCurrentUser = (user) => {
      return user.userId === userState.value.id;
    };

    const isSearch = ref(false);
    const showTip = ref(false);

    const onSearch = (value) => {
      if (!value) {
        state.participantList = state.originalParticipantList;
        return;
      }
      isSearch.value = true;
      state.participantList = state.originalParticipantList;
      const filterData = state.participantList.filter((e) => {
        return (
          (e.status === 1 && e.userName.indexOf(value) > -1) ||
          (e.status === 1 && e.account.indexOf(value) > -1)
        );
      });
      state.participantList = filterData;
      if (state.participantList.length === 0) {
        showTip.value = true;
      } else {
        showTip.value = false;
      }
    };

    const participantList = computed(() => {
      return store.getters.getParticipantList;
    });

    watch(
      () => participantList,
      async (newVal, oldVal) => {
        // console.log("watch__", newVal, oldVal);
        state.participantList = await handleParticipantList(
          participantList.value
        );

        state.originalParticipantList = JSON.parse(
          JSON.stringify(state.participantList)
        );
      },
      {
        immediate: true,
        // deep: true
      }
    );

    onMounted(async () => {});

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    return {
      state,
      selectedId,
      isShowInviteDialog,
      hideInviteDialog,
      isShowEditDialog,
      hideEditDialog,
      openEditDialog,
      isShowTipDialog,
      openTipDialog,
      hideTipDialog,
      selectedUserInfo,
      getParticipantList,
      handleParticipantList,
      isSearch,
      showTip,
      onSearch,
      checkIsCurrentUser,
      isEditable,
    };
  },
};
</script>
<style lang="scss" scoped>
$operation-height: 32px;
$sidebar-trigger-height: 40px;

.member-list-wrapper {
  height: 100%;
  padding-left: 8px;
  // margin: 0 0 0 15px;
}

.member-list-header {
  margin: 10px 0;
  color: rgb(107, 107, 107);
  font-weight: 500;
}

.member-list-operation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  // margin-top: 20px;
  margin-bottom: 10px;
}

.member-list {
  height: calc(100% - #{$operation-height});
  // height: calc(100% - #{$operation-height} - #{$sidebar-trigger-height});
  overflow: auto;
  padding-left: 10px;

  // &__empty {
  //   margin-top: 16px;
  //   text-align: center;
  // }

  &__sub-title {
    display: block;
    margin-bottom: 5px;
    color: rgb(107, 107, 107);
    font-size: 14.5px;
    font-weight: 500;
  }

  &__admin {
    margin-bottom: 12px;
  }

  &__item-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    // margin-left: 10px;
    font-size: 14.5px;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    span {
      //margin-bottom: 3px;
      font-size: 12px;
    }
  }

  &__item-avatar {
    flex-basis: 10%;
  }

  &__item-details {
    display: flex;
    flex-direction: column;

    &:deep(.anticon-star) {
      margin-left: 4px;
      font-size: 12px;
      color: #00b0f3;
    }

    &:deep(.anticon-crown) {
      margin-left: 4px;
      font-size: 12px;
      color: #ffc824;
      vertical-align: 0;
    }
  }

  &__item {
    margin-bottom: 8px;
  }
}

.user-name {
  display: flex;
  // align-items: baseline;
}

.empty-block-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.empty-block {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  text-align: center;
  transform: translate(-50%, -50%);

  &__header {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
  }
}

.current-user-info {
  font-weight: 600;
}

.ant-dropdown-menu-title-content {
  a {
    font-weight: 500;
    font-size: 13px;
    color: #333;
    line-height: 16px;
  }
}

.actions {
  display: flex;
  margin-left: auto;

  &__item {
    width: 24px;
    height: 24px;
    margin-left: 5px;
    padding: 3px;
    cursor: pointer;
    transform: scale(0.9);
  }
}

.tip-text {
  margin-top: 16px;
  text-align: center;
  // font-size: 16px;
  font-weight: 600;
}

.icon-star {
  width: 16px;
  height: 14px;
  display: block;
  margin-left: 8px;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("~@/assets/img/sidebar/icon-star.svg");
}

.icon-delete {
  width: 100%;
  height: 100%;
  display: block;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: auto;
  background-image: url("~@/assets/img/sidebar/icon-delete.png");

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: auto;
    background-image: url("~@/assets/img/sidebar/icon-delete-hover.png");
  }
}
.icon-edit {
  width: 100%;
  height: 100%;
  display: block;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: auto;
  background-image: url("~@/assets/img/sidebar/icon-edit.png");

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: auto;
    background-image: url("~@/assets/img/sidebar/icon-edit-hover.png");
  }
}
</style>

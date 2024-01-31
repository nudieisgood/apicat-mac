<template>
  <a-dropdown
    overlayClassName="workspaces-dropdown"
    trigger="click"
    v-model:open="dropdownVisible"
  >
    <template #overlay>
      <a-menu @click="changeWorkspace" v-if="dropdownVisible">
        <div class="workspaces__header">
          <a-button @click="openCreateDialog"
            ><plus-outlined />Create Workspace</a-button
          >
        </div>
        <div
          class="workspaces__list"
          v-if="workspaceList && workspaceList.length"
        >
          <a-menu-item
            v-for="workspace in workspaceList"
            :key="workspace.workspaceId"
            class="workspaces__list-item"
          >
            <a>{{ workspace.name }}</a>
            <div class="actions">
              <!-- 判斷此工作區是否為自己擁有，是的話顯示垃圾桶圖示，否則顯示離開圖示。 -->
              <span
                v-if="checkUserIsWorkspaceCreator(workspace.ownerId)"
                class="actions__item"
                @click.stop="openTipDialog(workspace.workspaceId)"
              >
                <span class="icon-delete" />
              </span>
              <span
                v-else
                class="actions__item"
                @click.stop="handleLeave(workspace.workspaceId)"
              >
                <img src="@/assets/img/sidebar/icon-exit.svg" alt="" />
              </span>
              <span
                v-if="checkUserIsWorkspaceCreator(workspace.ownerId)"
                class="actions__item"
                @click.stop="openEditDialog(workspace.workspaceId)"
              >
                <span class="icon-edit" />
              </span>
            </div>
          </a-menu-item>
        </div>
        <div v-else class="workspaces__empty">
          <p>No data</p>
        </div>
      </a-menu>
    </template>
    <a><block-outlined />Workspaces</a>
  </a-dropdown>
  <create-dialog
    v-if="isShowCreateDialog"
    :dialogVisible="isShowCreateDialog"
    @close-create-dialog="isShowCreateDialog = false"
    @change-workspace="changeWorkspace"
  />
  <edit-dialog
    v-if="isShowEditDialog"
    :dialogVisible="isShowEditDialog"
    @close-edit-dialog="isShowEditDialog = false"
    :workspaceId="selectedId"
  />
  <tip-dialog
    v-if="isShowTipDialog"
    :dialogVisible="isShowTipDialog"
    @close-tip-dialog="isShowTipDialog = false"
    :workspaceId="selectedId"
    @show-message-dialog="openMessageDialog"
  />
  <message-dialog
    v-if="isShowMessageDialog"
    :dialog-visible="isShowMessageDialog"
    @close-message-dialog="hideMessageDialog"
    :workspaceId="selectedId"
    :message="message"
    @show-transfer-dialog="showTransferDialog"
  />
  <transfer-dialog
    v-if="isShowTransferDialog"
    :dialog-visible="isShowTransferDialog"
    @close-transfer-dialog="isShowTransferDialog = false"
    :workspaceId="selectedId"
  />
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, inject } from "vue";
import CreateDialog from "@/components/Layout/Header/Workspace/createDialog.vue";
import EditDialog from "@/components/Layout/Header/Workspace/editDialog.vue";
import TipDialog from "@/components/Layout/Header/Workspace/tipDialog.vue";
import workspaceData from "@/store/workspace";
import { useStore } from "vuex";
import MessageDialog from "@/components/MessageDialog";
import TransferDialog from "@/components/Layout/Header/Workspace/transferDialog.vue";

export default {
  components: {
    CreateDialog,
    EditDialog,
    TipDialog,
    MessageDialog,
    TransferDialog,
  },
  setup() {
    const $bus = inject("$bus");
    const store = useStore();
    const $modal = inject("$modal");

    const workspaceList = computed(() => {
      return store.getters.getWorkspaceList;
    });

    const workspaceState = computed(() => {
      return store.getters.getWorkspaceState;
    });

    const selectedId = ref(null);

    const dropdownVisible = ref(false);

    // 建立workspace 相關參數及func
    const isShowCreateDialog = ref(false);

    const openCreateDialog = () => {
      dropdownVisible.value = false;
      isShowCreateDialog.value = true;
    };

    // 編輯workspace 相關參數及func
    const isShowEditDialog = ref(false);

    const openEditDialog = (id) => {
      selectedId.value = Number(id);
      dropdownVisible.value = false;
      isShowEditDialog.value = true;
    };

    // 刪除workspace 相關參數及func
    const isShowTipDialog = ref(false);

    const openTipDialog = (id) => {
      selectedId.value = Number(id);
      dropdownVisible.value = false;
      isShowTipDialog.value = true;
    };

    const changeWorkspace = async ({ key }) => {
      dropdownVisible.value = false;
      if (key === workspaceState.value.workspaceId) return; // 再次點選當前workspace，則不進行切換動作

      await workspaceData.initWorkspaceData(key);
    };

    onMounted(() => {
      $bus.on("openCreateDialog", () => {
        openCreateDialog();
      });
    });

    onBeforeUnmount(() => {
      $bus.off("openCreateDialog");
    });

    const isShowMessageDialog = ref(false);
    const message = ref(
      "There are other participants in this workspace and cannot be deleted. Do you want to transfer workspace owner to another participant??"
    );
    const openMessageDialog = () => {
      dropdownVisible.value = false;
      isShowMessageDialog.value = true;
    };

    const hideMessageDialog = () => {
      isShowMessageDialog.value = false;
    };

    const isShowTransferDialog = ref(false);

    // 轉移權限彈窗
    const showTransferDialog = () => {
      hideMessageDialog();
      isShowTransferDialog.value = true;
    };

    const userState = computed(() => {
      return store.getters.getUserState;
    });

    const checkUserIsWorkspaceCreator = (workspaceCreatorId) => {
      return workspaceCreatorId === userState.value.id;
    };

    const handleLeave = (workspaceId) => {
      dropdownVisible.value = false;
      $modal.confirm({
        title: "Do you want to leave the workspace ?",
        onOk() {
          onLeave(workspaceId);
        },
        onCancel() {},
      });
    };

    const onLeave = async (workspaceId) => {
      const res = await workspaceData.handleLeaveWorkspace(workspaceId);
      if (res.code === 20000) {
        window.showNotification("success", "Leave workspace successfully.");
      } else {
        window.showNotification("warn", res.message);
      }
    };

    return {
      selectedId,
      dropdownVisible,
      isShowCreateDialog,
      openCreateDialog,
      isShowEditDialog,
      openEditDialog,
      isShowTipDialog,
      openTipDialog,
      changeWorkspace,
      isShowMessageDialog,
      hideMessageDialog,
      openMessageDialog,
      message,
      showTransferDialog,
      isShowTransferDialog,
      checkUserIsWorkspaceCreator,
      handleLeave,
      workspaceList,
    };
  },
};
</script>
<style lang="scss" scoped>
.workspaces {
  &__header {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid $secondary-light-grey;

    &:deep(.ant-btn) {
      width: 100%;
      height: 26px;
      padding: 0 15px;
      text-align: center;
      border: unset;

      &:hover {
        color: $primary-white;

        .anticon {
          color: $primary-white;
        }
      }
    }
  }

  &__list {
    height: 300px;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    .actions {
      z-index: 100;
      display: flex;
      align-items: center;

      &__item {
        width: 24px;
        height: 24px;
        margin-left: 5px;
        padding: 3px;
        transform: scale(0.85);

        img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
    }
  }

  &__empty {
    margin-top: 16px;
    text-align: center;
  }
}

.ant-dropdown-menu-title-content {
  a {
    width: 80%;
    font-weight: 500;
    font-size: 13px;
    color: #333;
    line-height: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
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

<template>
  <!-- 提示刪除彈窗-->
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      :title="dialogTitle"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">Are you sure you want to delete?</p>
        <p class="modal__message">You cannot undo this action.</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button class="" @click="deleteCurrentItem">Delete</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref, watch, toRefs, getCurrentInstance } from "vue";
import { useStore } from "vuex";
import Helper from "@/js/utils/helper";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    deletedId: {
      type: Number,
      default: null,
    },
    deletedData: {
      type: Object,
      default: () => {},
    },
    dialogTitle: {
      type: String,
      default: "",
    },
  },
  emits: {
    "close-dialog": null,
    "delete-current-data": null,
  },
  setup(props, context) {
    const store = useStore();
    const app = getCurrentInstance();
    const { dialogVisible, deletedId, deletedData, dialogTitle } =
      toRefs(props);
    const visible = ref(false);

    watch(
      dialogVisible,
      () => {
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    const deleteId = ref("");
    watch(
      deletedId,
      () => {
        deleteId.value = deletedId.value;
      },
      {
        immediate: true,
      }
    );

    const cancel = (e) => {
      closeDialog();
    };

    const closeDialog = () => {
      visible.value = false;
      // store.commit("SET_PROCESSING_MODE", false);
      context.emit("close-dialog");
    };

    const deleteCurrentItem = () => {
      context.emit("delete-current-data");
    };

    return {
      app,
      visible,
      deleteId,
      cancel,
      closeDialog,
      deleteCurrentItem,
    };
  },
};
</script>

<style lang="scss" scoped>
$headerHeight: 32px;

.modal {
  // &__content {
  //   height: calc(100% - $headerHeight);
  //   max-height: 340px;
  //   // margin-bottom: 20px;
  //   overflow-y: scroll;
  //   // padding-right: 7px;
  // }

  &__btns {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;

    .ant-btn {
      margin-left: 8px;
    }
  }
}
</style>

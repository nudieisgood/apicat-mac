<template>
  <div class="tip-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      title="CONFIRM FORCE CLOSE"
      @cancel="closeDialog"
      :footer="null"
      width="450px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">
          {{ totalEditingTabNum }} tab has unsaved changes. Your changes will be
          lost if you force close this tab. Are you sure you want to force
          close?
        </p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button class="" @click="forceClose">Force Close</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs } from "vue";

import { useStore } from "vuex";
// import tabsData from '@/store/tabs'

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    totalEditingTabNum: {
      type: Number,
      default: null,
    },
  },
  emits: {
    "close-confirm-dialog": null,
    "reset-deleted-data": null, // 成功刪除資料後，須將原本傳入欲刪除的資料重置
  },
  setup(props, context) {
    const store = useStore();
    // const app = getCurrentInstance()
    const { dialogVisible } = toRefs(props);
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

    const cancel = (e) => {
      closeDialog();
    };

    const closeDialog = () => {
      visible.value = false;
      context.emit("close-confirm-dialog");
    };

    const forceClose = () => {
      store.commit("CLEAR_ALL_TAB");
      closeDialog();
    };

    return {
      // app,
      visible,
      cancel,
      closeDialog,
      forceClose,
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
  &__message {
    margin-bottom: 24px;
  }
  &__btns {
    display: flex;
    justify-content: flex-end;

    .ant-btn {
      margin-left: 8px;
    }
  }
}
</style>

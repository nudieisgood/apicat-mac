<template>
  <div class="message-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      :title="`MESSAGE`"
      @cancel="closeDialog"
      :footer="null"
      width="350px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">{{ message }}</p>
        <div class="modal__btns">
          <a-button class="btn-cancel" @click="cancel">Cancel</a-button>
          <a-button class="" @click="confirm">Confirm</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs, getCurrentInstance } from "vue";
import { useStore } from "vuex";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
    confirmFunc: {
      type: Function,
      default: () => {},
    },
  },
  emits: {
    "close-message-dialog": null,
    "show-transfer-dialog": null,
  },
  setup(props, context) {
    const store = useStore();
    const app = getCurrentInstance();
    const { dialogVisible, confirmFunc } = toRefs(props);
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
      context.emit("close-message-dialog");
    };

    const confirm = () => {
      // console.log("yo");
      // console.log(confirmFunc.value);
      // let func = confirmFunc.value;
      // func();
      context.emit("show-transfer-dialog");
    };

    return {
      app,
      visible,
      cancel,
      closeDialog,
      confirm,
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

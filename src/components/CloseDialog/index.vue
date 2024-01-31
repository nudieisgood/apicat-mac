<template>
  <div class="close-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      :title="`Do You Want To Save?`"
      @cancel="closeDialog"
      :footer="null"
      width="450px"
      centered
    >
      <div class="modal__content">
        <p class="modal__message">
          This tab <span class="tab-name">{{ currentCloseTab.name }}</span> has
          unsaved changes which will be lost if you choose to close it. Save
          these changes to avoid losing your work.
        </p>
        <div class="modal__btns">
          <a-button class="modal__btns--btn" @click="unsave"
            >Don't save</a-button
          >
          <div>
            <a-button class="modal__btns--btn" @click="cancel">Cancel</a-button>
            <a-button class="modal__btns--btn modal__btns--save" @click="save"
              >Save changes</a-button
            >
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { toRefs, ref, watch, computed } from "vue";
import { useStore } from "vuex";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    currentCloseTabKey: {
      type: String,
      default: "",
    },
  },
  setup(props, context) {
    const store = useStore();
    const { dialogVisible, currentCloseTabKey } = toRefs(props);
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
      context.emit("close-close-dialog");
    };

    const save = () => {
      visible.value = false;
      context.emit("save-change");
    };

    const unsave = () => {
      visible.value = false;
      context.emit("unsave-change");
    };

    const currentCloseTab = ref({});

    const tabsPane = computed(() => {
      return store.getters.getTabsPane;
    });

    watch(
      currentCloseTabKey,
      () => {
        if (currentCloseTabKey.value) {
          currentCloseTab.value = tabsPane.value.find(
            (pane) =>
              `${pane.tabKey}-${pane.tabType}` === currentCloseTabKey.value
          );
        }
        visible.value = dialogVisible.value;
      },
      {
        immediate: true,
      }
    );

    return {
      visible,
      cancel,
      save,
      unsave,
      closeDialog,
      currentCloseTab,
    };
  },
};
</script>

<style lang="scss" scoped>
.modal__message {
  margin-bottom: 1.5rem;
}

.modal__btns {
  display: flex;
  justify-content: space-between;
}

.modal__btns--btn {
  width: 110px;
  height: unset;
  padding: 5px 10px !important;
  border-radius: 5px;
  color: #3c3c3c;
}

.modal__btns--save {
  margin-left: 0.5rem;
  background-color: $primary-white;
  border-color: $primary-blue;
  color: $primary-blue;

  &:hover {
    background-color: $primary-blue;
    border-color: $primary-blue;
    color: $primary-white;
  }
}

.tab-name {
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
}
</style>

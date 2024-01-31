<template>
  <div>
    <a-modal
      v-model:open="visible"
      title="SETTINGS"
      class="setting-modal"
      width="600px"
      @cancel="closeDialog"
      :footer="null"
    >
      <div class="modal__content">
        <div class="setting-modal__sidebar">
          <div class="setting-modal__sidebar-container">
            <div
              class="setting-modal__sidebar-item"
              v-for="tab in tabList"
              :key="tab.label"
              :class="{ 'is-selected': activeKey === tab.key }"
              @click="changeTab(tab)"
            >
              {{ tab.label }}
            </div>
          </div>
        </div>
        <div class="setting-modal__content">
          <div class="setting-modal__block" v-if="activeKey === 'certificates'">
            <div class="setting-modal__block-title">Certificates</div>

            <a-form
              ref="editFormRef"
              :model="certificatesState"
              layout="vertical"
            >
              <a-form-item
                ref="userName"
                label="CA certificates"
                name="certificates"
              >
                <a-switch
                  v-model:checked="certificatesState.switchCertificates"
                />
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import {
  watch,
  toRefs,
  ref,
  reactive,
  getCurrentInstance,
  computed,
  onMounted,
} from "vue";
import store from "@/store";

export default {
  components: {},
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-setting-dialog": null,
  },
  setup(props, context) {
    const app = getCurrentInstance();
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
      context.emit("close-setting-dialog");
    };

    const tabList = reactive([
      {
        label: "Certificates",
        key: "certificates",
      },
    ]);

    const activeKey = ref("certificates");

    const changeTab = (tab) => {
      activeKey.value = tab.key;
    };

    const certificatesState = reactive({
      switchCertificates: false,
    });

    onMounted(() => {
      certificatesState.switchCertificates = store.getters.isEnableCertificates;
    });

    watch(
      () => certificatesState.switchCertificates,
      () => {
        store.commit(
          "SET_CERTIFICATES_STATUS",
          certificatesState.switchCertificates
        );
        if (certificatesState.switchCertificates) {
          // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
        } else {
          // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        }
      }
    );

    return {
      visible,
      cancel,
      closeDialog,
      tabList,
      activeKey,
      changeTab,
      certificatesState,
    };
  },
};
</script>

<style lang="scss" scoped>
.modal {
  &__content {
    // max-height: 340px;
    height: 400px;
    display: flex;
  }
}

.setting-modal {
  &__sidebar {
    flex-basis: 25%;
  }

  &__sidebar-item {
    padding: 2px 0 2px 8px;
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    cursor: pointer;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    &:hover {
      background-color: #e8f7ff;
      // background-color: #ffcc3394;
    }
  }

  .is-selected {
    background-color: $light-blue;
  }

  &__content {
    overflow-y: scroll;
    padding: 0 20px;
    border-left: 1px solid #e0e0e0;
    flex-basis: 75%;
  }
}

:deep(.ant-row) {
  flex-flow: unset;
  align-items: center;
  justify-content: space-between;
}

:deep(.ant-form-vertical) {
  .ant-form-item-label {
    flex: 1;
    padding: 0;
  }

  .ant-form-item {
    .ant-form-item-control {
      width: auto;
    }
  }
}
</style>

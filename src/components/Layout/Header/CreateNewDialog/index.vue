<template>
  <div class="create-new-dialog-wrapper">
    <a-modal
      v-model:open="visible"
      title="Create New"
      @cancel="closeDialog"
      :footer="null"
      width="850px"
      centered
    >
      <div class="modal__content">
        <div class="modal__intro">
          <div class="modal__intro__heading">Building Blocks</div>
          <div class="modal__intro__cards">
            <div
              class="modal__intro__card"
              @click="emitCreateEvent(card.eventName)"
              v-for="(card, index) in cardList"
              :key="index"
              v-show="card.isShow"
            >
              <div class="modal__intro__card-icon">
                <component :is="card.icon" />
              </div>
              <div class="modal__intro__card-content">
                <div class="modal__intro__card-title">{{ card.title }}</div>
                <div class="modal__intro__card-desc">{{ card.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script>
import { ref, watch, toRefs, reactive, computed, inject } from "vue";
import store from "@/store";

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "close-create-dialog": null,
  },
  setup(props, context) {
    const $bus = inject("$bus");
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

    const closeDialog = () => {
      context.emit("close-create-dialog");
    };

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    const cardList = reactive([
      {
        title: "HTTP Request",
        icon: "file-text-outlined",
        desc: "Create a basic HTTP request",
        eventName: "addRequest",
        isShow: true,
      },
      {
        title: "Collection",
        icon: "folder-outlined",
        desc: "Save your requests in a collection for reuse and sharing",
        eventName: "addCollection",
        isShow: isEditable.value,
      },
      {
        title: "Environment",
        icon: "block-outlined",
        desc: "Save values you frequently use in an environment",
        eventName: "addEnvironment",
        isShow: isEditable.value,
      },
      {
        title: "Workspace",
        icon: "appstore-outlined",
        desc: "Create a workspace to build independently or in collaboration",
        eventName: "openCreateDialog",
        isShow: true,
      },
    ]);

    const emitCreateEvent = (eventName) => {
      $bus.emit(eventName);
      closeDialog();
    };

    return {
      visible,
      closeDialog,
      cardList,
      emitCreateEvent,
    };
  },
};
</script>

<style lang="scss" scoped>
$headerHeight: 32px;

.modal {
  &__intro {
    &__heading {
      margin-bottom: 5px;
    }

    &__cards {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    &__card {
      display: flex;
      align-items: center;
      flex-basis: 33%;
      padding: 10px 5px;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: rgb(203, 217, 231);
      }
    }

    &__card-icon {
      margin-right: 15px;

      &:deep(.anticon) {
        font-size: 30px;
      }
    }

    &__card-content {
      flex: 1;
    }

    &__card-title {
      color: #046fd9;
      font-weight: 600;
    }

    &__card-desc {
      font-size: $text-size-m;
    }
  }
}
</style>

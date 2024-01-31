<template>
  <div class="action-menu">
    <div class="action-menu__item action-menu__item-create" v-if="isEditable">
      <a-tooltip placement="bottom">
        <template #title>
          <span>{{ title }}</span>
        </template>
        <a-button class="btn-create" @click="create">
          <template #icon>
            <plus-outlined />
          </template>
        </a-button>
      </a-tooltip>
    </div>
    <div class="action-menu__item action-menu__item-import" v-if="currentTabName === 'Collection'">
      <a-tooltip placement="bottom">
        <template #title>
          <span>Import Collection</span>
        </template>
        <a-button class="btn-import" @click="showImport = !showImport">
          <template #icon>
            <div class="">
              <img :src="require('@/assets/img/sidebar/icon-import.png')" alt="not-hover-icon"
                class="icon-import--not-hover" />
              <img :src="require('@/assets/img/sidebar/icon-import-hover.png')" alt="hover-icon"
                class="icon-import--hover" />
            </div>
          </template>
        </a-button>
      </a-tooltip>
    </div>
    <div class="action-menu__item action-menu__item-search">
      <a-input placeholder="Search" @input="handleInput" v-model:value="inputValue">
        <template #suffix>
          <search-outlined />
        </template>
      </a-input>
      <!-- <a-input-search placeholder="Search" @input="handleInput" v-model:value="inputValue">
    </a-input-search> -->
    </div>
  </div>
  <import-dialog v-if="showImport" :dialogVisible="showImport"
    @close-import-dialog="showImport = !showImport"></import-dialog>
</template>
<script>
import { ref, toRefs, watch, computed } from "vue";
import ImportDialog from "@/components/Layout/Header/Workspace/importDialog.vue";
import Helper from "@/js/utils/helper";
import store from "@/store";

export default {
  components: {
    ImportDialog,
  },
  props: {
    currentTabName: {
      type: String,
      default: "Collection",
    },
  },
  emits: {
    create: null,
    search: null,
  },
  setup(props, context) {
    const { currentTabName } = toRefs(props);
    const showImport = ref(false);
    const inputValue = ref("");

    const create = Helper.throttle(() => {
      context.emit("create");
    });

    const handleInput = ($event) => {
      context.emit("search", $event.target.value);
    };

    const title = ref("");

    watch(
      currentTabName,
      () => {
        if (currentTabName.value === "Collection") {
          title.value = "Create new collection";
        } else if (currentTabName.value === "Members") {
          title.value = "Invite a member";
        } else if (currentTabName.value === "Environments") {
          title.value = "Create new environment";
        }
      },
      {
        immediate: true,
      }
    );

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    watch(
      () => currentWorkspace.value.id,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          inputValue.value = "";
        }
      },
      {
        // immediate: true,
        // deep: true
      }
    );

    const isEditable = computed(() => {
      return store.getters.isEditable;
    });

    return {
      showImport,
      create,
      inputValue,
      handleInput,
      title,
      isEditable,
    };
  },
};
</script>
<style scoped lang="scss">
.action-menu {
  width: 100%;
  max-height: 34px;
  display: flex;
  align-content: center;
  justify-content: space-between;
  padding-bottom: 7px;
  border-bottom: 1px solid $primary-dark-grey;

  &__item {
    &:deep(.ant-btn) {
      width: 26px;
      height: 26px;
      border: unset;
      background: transparent;

      &:hover {
        border: 1px solid $primary-blue;
        background: transparent;
      }
    }
  }

  &__item-create {
    margin-right: 6px;

    .ant-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__item-import {
    margin-right: 6px;
  }

  &__item-search {
    flex: 1;
    display: flex;
    align-items: center;
  }

  // .icon-import {
  //   width: 100%;
  //   height: 100%;
  //   display: block;
  //   background-position: center center;
  //   background-repeat: no-repeat;
  //   background-size: auto;
  //   background-image: url("~@/assets/img/sidebar/icon-import.png");

  //   &:hover {
  //     background-position: center center;
  //     background-repeat: no-repeat;
  //     background-size: auto;
  //     background-image: url("~@/assets/img/sidebar/icon-import-hover.png");
  //   }
  // }

  .icon-import {
    position: relative;
    width: 100%;
    height: 100%;
    display: block;

    img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: none;
    }

    &--not-hover {
      opacity: 1;
    }

    &--hover {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
    }

    &:hover {
      .icon-import--not-hover {
        opacity: 0;
      }

      .icon-import--hover {
        opacity: 1;
      }
    }
  }
}
</style>

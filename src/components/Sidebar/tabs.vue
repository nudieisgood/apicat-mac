<template>
  <div
    :style="{ width: isCollapsed ? '88px' : `${currentWidth}px` }"
    class="tabs-container"
  >
    <a-tabs
      v-model:activeKey="activeKey"
      tab-position="left"
      @tab-click="tabClick"
      @change="changeTab"
    >
      <template #leftExtra>
        <div class="menu-icon" @click="collapse">
          <div class="menu-icon--collapse icon-hover" v-if="isCollapsed"></div>
          <div
            class="menu-icon--expand icon-hover"
            v-else
            :class="{ 'menu-icon--expand-active': !isCollapsed }"
          ></div>
        </div>
      </template>
      <a-tab-pane v-for="tab in tabList" :key="tab.tabName">
        <template #tab>
          <div
            class="tab-box icon-hover"
            :class="{ 'icon-actived': tab.tabName === activeKey }"
          >
            <img :src="require(`@/assets/img/sidebar/${tab.icon}`)" alt="" />
            <!-- <component :is="tab.icon" /> -->
            <p>{{ tab.tabName }}</p>
          </div>
        </template>
        <tree v-if="tab.tabName === 'Collection'" />
        <members v-else-if="tab.tabName === 'Members'" />
        <environment v-else-if="tab.tabName === 'Environments'" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
<script>
import { reactive, ref, toRefs, watch, computed } from "vue";
// import Tree from "@/components/Sidebar/tree2.vue";
import Tree from "@/components/Sidebar/tree.vue";
import Members from "@/components/Sidebar/Members";
import Environment from "@/components/Sidebar/environment";
import store from "@/store";

export default {
  components: {
    Tree,
    Members,
    Environment,
  },
  name: "tabs",
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    realWidth: {
      type: Number,
      default: null,
    },
  },
  emits: {
    "update-collapsed": null,
    "on-collapse": null,
  },
  setup(props, context) {
    const { isCollapsed, realWidth } = toRefs(props);
    const activeKey = ref("Collection");
    const collapsed = ref(false);
    const currentWidth = ref(null);

    const tabClick = () => {
      collapsed.value = false;
      context.emit("update-collapsed");
    };

    watch(
      isCollapsed,
      (val) => {
        if (val) {
          activeKey.value = "";
        } else {
          activeKey.value = "Collection";
          currentWidth.value = 400;
        }
      },
      {
        immediate: true,
      }
    );

    watch(
      realWidth,
      (val) => {
        currentWidth.value = realWidth.value;
      },
      {
        immediate: true,
      }
    );

    const changeTab = (activeKey) => {
      // console.log(activeKey)
    };

    const tabList = reactive([
      {
        tabName: "Collection",
        icon: "icon-collection.svg",
      },
      {
        tabName: "Members",
        icon: "icon-members.svg",
      },
      {
        tabName: "Environments",
        icon: "icon-environment.svg",
      },
    ]);

    const currentWorkspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    watch(
      () => currentWorkspace.value.id,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          activeKey.value = "Collection";
        }
      },
      {
        // deep: true
      }
    );

    const collapse = () => {
      context.emit("on-collapse");
    };

    return {
      activeKey,
      collapsed,
      tabClick,
      changeTab,
      currentWidth,
      tabList,
      collapse,
    };
  },
};
</script>
<style lang="scss" scoped>
$sidebar-header-height: 43px;

.tabs-container {
  position: relative;
  height: 100%;
  // height: calc(100% - #{$sidebar-header-height});
  padding-bottom: 25px;

  &:deep(.ant-tabs-bar) {
    border-top: 1px solid $secondary-light-grey;
    border-right: 1px solid $secondary-light-grey;
    border-bottom: 1px solid $secondary-light-grey;
    border-radius: 0 10px 10px 0;

    .ant-tabs-nav-container {
      padding-top: 65px;
    }
  }

  &:deep(.ant-tabs-tabpane) {
    position: relative;
  }
}

.tab-box {
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    margin-top: 3px;
    margin-bottom: 0;
    font-size: 10.5px;
  }
}

.ant-tabs-nav {
  .ant-tabs-tab {
    .anticon {
      margin-right: 0;
    }
  }
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin: 16px auto;
  // padding: 10px;
  z-index: 5;
  cursor: pointer;

  &--collapse {
    width: 100%;
    height: 100%;
    display: block;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/sidebar/icon-collapsed.png");

    &:hover {
      background-position-y: center;
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/sidebar/icon-collapsed-hover.png");
    }
  }

  &--expand {
    width: 100%;
    height: 100%;
    display: block;
    background-position-y: center;
    background-repeat: no-repeat;
    background-size: contain;
    background-image: url("~@/assets/img/sidebar/icon-expand.png");

    &:hover {
      background-position-y: center;
      background-repeat: no-repeat;
      background-image: url("~@/assets/img/sidebar/icon-expand-hover.png");
    }
  }

  &--expand-active {
    background-image: url("~@/assets/img/sidebar/icon-expand-hover.png");
  }
}

:deep(.ant-tabs-extra-content) {
  margin-right: 0;
}
</style>

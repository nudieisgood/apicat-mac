<template>
  <!-- workspace 主頁-->
  <div class="workspace-wrapper">
    <div class="workspace-container">
      <div class="workspace-header">
        <div class="workspace-header__info">
          <div class="workspace-header__info-icon">
            <user-outlined v-if="participantList.length === 1" />
            <team-outlined v-else />
          </div>
          <div class="workspace-header__info-name">
            {{ workspace.name }}
          </div>
        </div>
      </div>
      <div class="workspace-summary">
        {{ workspace.summary }}
      </div>
      <div class="workspace-activity">
        <div class="workspace-activity-header">
          <div class="workspace-activity-refresh">
            <div class="workspace-activity-refresh__text">Activity</div>
            <div
              class="workspace-activity-refresh__button"
              @click="refreshData"
            >
              <redo-outlined />
            </div>
          </div>
          <div class="workspace-activity-filter">
            <div class="workspace-activity-filter__text">Filter by</div>
            <div class="workspace-activity-filter__col">
              <a-dropdown
                :trigger="['click']"
                :getPopupContainer="(trigger) => trigger.parentNode"
                v-model:open="typeDropdownVisible"
              >
                <a class="ant-dropdown-link" @click.prevent>
                  Elements
                  <down-outlined />
                </a>
                <template #overlay>
                  <a-checkbox-group
                    v-model:value="filterParams.itemTypeList"
                    name="checkboxgroup"
                    :options="typeOptions"
                    @change="getFilterList"
                  />
                </template>
              </a-dropdown>
            </div>
            <div class="workspace-activity-filter__col">
              <a-dropdown
                :trigger="['click']"
                :getPopupContainer="(trigger) => trigger.parentNode"
                v-model:open="memberDropdownVisible"
              >
                <a class="ant-dropdown-link" @click.prevent>
                  Members
                  <down-outlined />
                </a>
                <template #overlay>
                  <div
                    v-if="!participantList || !participantList.length"
                    class="ant-dropdown-menu-group workspace-activity-filter__col-empty"
                  >
                    No members！
                  </div>
                  <a-checkbox-group
                    v-else
                    v-model:value="filterParams.userIdList"
                    name="checkboxgroup"
                    :options="participantList"
                    @change="getFilterList"
                  />
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
        <div class="workspace-activity-list">
          <transition name="fade" v-if="state.loading">
            <div class="loading-box" v-if="state.loading">
              <a-spin :spinning="state.loading" tip="Loading" />
            </div>
          </transition>
          <div
            v-if="workspace.id"
            v-infinite-scroll="loadMore"
            infinite-scroll-throttle-delay="800"
            infinite-scroll-disabled="busy"
            :infinite-scroll-distance="10"
            class="infinite-scroll-wrapper"
          >
            <div
              class="list-item"
              v-for="(item, index) in activityList"
              :key="index"
            >
              <div class="list-item__row-date">{{ item.createDate }}</div>
              <div class="list-item__row-activity">
                <div
                  class="list-item__row-item"
                  v-for="(activity, index) in item.dailyActivityList"
                  :key="index"
                >
                  <div class="list-item__row-item-detail">
                    {{ activity.summary }}
                  </div>
                  <div class="list-item__row-item-time">
                    {{ activity.formattedTime }}
                  </div>
                </div>
              </div>
            </div>
            <div class="no-more-text" v-if="state.noMore">No more data！</div>
          </div>
          <div v-else class="empty-block">No data！</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { watch, reactive, toRefs, onMounted, ref, computed } from "vue";
import { getWorkspaceActivity } from "@/js/ipc/workspaceIPC.js";
import dayjs from "dayjs";
import { getActivityNameFromValue, typeList } from "@/js/enum/activityTypeEnum";
import ActionTypeEnum from "@/js/enum/actionTypeEnum.js";
import store from "@/store";

export default {
  props: {
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  setup(props) {
    const { tabInfo } = toRefs(props);
    const workspace = computed(() => {
      return store.getters.getCurrentWorkspace;
    });

    const filterParams = reactive({
      workspaceId: workspace.value.id,
      page: 1,
      size: 20,
      itemTypeList: [],
      userIdList: [],
    });

    const typeOptions = computed(() => {
      return typeList.map(({ value, name }) => ({
        label: name,
        value,
      }));
    });

    const activityList = ref([]);
    const originalActivityList = ref([]);

    const state = reactive({
      loading: false,
      noMore: false,
    });

    const busy = ref(false);

    const responseParams = reactive({
      totalPages: null,
      totalElements: null,
    });

    const getActivityList = async (paramsObj) => {
      state.loading = true;
      const res = await getWorkspaceActivity(paramsObj);

      if (res.code === 20000) {
        if (res.data.content) {
          responseParams.totalPages = res.data.totalPages;
          responseParams.totalElements = res.data.totalElements;
          originalActivityList.value = [
            ...originalActivityList.value,
            ...res.data.content,
          ];
          originalActivityList.value.sort((x, y) => y.createdAt - x.createdAt);
          activityList.value = handleActivityList(originalActivityList.value);
        }
      }

      if (filterParams.page > responseParams.totalPages) {
        busy.value = true;
        state.noMore = true;
        state.loading = false;
        return;
      }
      filterParams.page += 1;
      busy.value = false;
      state.loading = false;
    };

    const loadMore = () => {
      busy.value = true;
      getActivityList(filterParams);
    };

    const getFilterList = () => {
      filterParams.page = 1;
      activityList.value = [];
      originalActivityList.value = [];
      busy.value = true;
      state.noMore = false;
      loadMore();
    };

    const resetParams = () => {
      filterParams.workspaceId = workspace.value.id;
      filterParams.page = 1;
      filterParams.size = 10;
      filterParams.itemTypeList = [];
      filterParams.userIdList = [];
      activityList.value = [];
      originalActivityList.value = [];
      state.noMore = false;
      busy.value = false;
    };

    const refreshData = () => {
      resetParams();
      loadMore();
    };

    const handleActivityList = (activityList) => {
      const dateContainer = {};

      activityList.forEach((activity) => {
        activity.formattedTime = formatAndUseTime(activity.createdAt);
        activity.formattedDate = formatAndUseDate(activity.createdAt);
        activity.summary = formatAndUseDetail(activity);

        // 以日期做分類
        dateContainer[activity.formattedDate] =
          dateContainer[activity.formattedDate] || [];
        dateContainer[activity.formattedDate].push(activity);
      });

      const result = classifyList(dateContainer);

      return result;
    };

    const classifyList = (newData) => {
      const tempArr = [];
      for (const key in newData) {
        const obj = {};
        obj.createDate = key;
        obj.dailyActivityList = newData[key];
        tempArr.push(obj);
      }
      return tempArr;
    };

    const formatAndUseTime = (time) => {
      return dayjs(Number(time)).format("HH:mm A");
    };

    const formatAndUseDate = (time) => {
      return dayjs(Number(time)).format("MMM DD, YYYY");
    };

    const formatAndUseDetail = (activity) => {
      let summary = "";
      const actionText = handleActionText(activity.actionType);
      const activityText = getActivityNameFromValue(activity.activityType);
      summary = `${activity.userName} ${actionText} the ${activity.targetName} ${activityText}`;
      return summary;
    };

    const handleActionText = (actionVal) => {
      switch (actionVal) {
        case ActionTypeEnum.CREATE.value:
          return "created";
        case ActionTypeEnum.UPDATE.value:
          return "updated";
        case ActionTypeEnum.DELETE.value:
          return "deleted";
        case ActionTypeEnum.MOVE.value:
          return "moved";
        case ActionTypeEnum.IMPORT.value:
          return "imported";
        default:
          return "";
      }
    };

    const participantList = ref([]);

    const handleParticipantList = () => {
      const tempArr = [];
      store.getters.getParticipantList.forEach((e, index) => {
        const obj = {};
        obj.label = e.userName;
        obj.value = e.userId;
        tempArr.push(obj);
      });
      return tempArr;
    };

    const typeDropdownVisible = ref(false);

    const memberDropdownVisible = ref(false);

    watch(
      () => workspace.value.id,
      (workspaceId) => {
        if (workspaceId) {
          filterParams.workspaceId = workspace.value.id;
        }
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {
      if (!workspace.value.id) {
        return;
      }
      participantList.value = handleParticipantList();
    });

    return {
      filterParams,
      activityList,
      state,
      loadMore,
      refreshData,
      getFilterList,
      dayjs,
      typeOptions,
      participantList,
      typeDropdownVisible,
      memberDropdownVisible,
      busy,
      workspace,
      typeList,
    };
  },
};
</script>

<style lang="scss" scoped>
$header-height: 61.7px;
$summary-height: 49px;
$workspace-activity-header-height: 26px;
$workspace-activity-header-margin: 12px;
$tolerance-length: 45px;

.workspace-wrapper {
  height: 100%;
}

.workspace-container {
  max-width: 600px;
  height: 100%;
  margin: auto;
  font-size: $text-size-m;
}

.workspace-header {
  padding: 12px 0;

  &__info {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
  }

  &__info-icon {
    span {
      font-size: 20px;
    }
  }

  &__info-name {
    margin-left: 8px;
  }
}

.workspace-summary {
  padding: 0 0 16px;
  line-height: 1.5;
}

.workspace-activity {
  height: calc(
    100% - #{$header-height} - #{$summary-height} - #{$workspace-activity-header-margin}
  );
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
}

.workspace-activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.workspace-activity-refresh {
  display: flex;
  align-items: center;

  &__text {
    margin-right: 8px;
    font-size: 12.5px;
    font-weight: 600;
  }

  &__button {
    padding: 2px 6px;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background-color: #e0e0e0;
    }
  }
}

.workspace-activity-filter {
  display: flex;
  align-items: center;

  &__col {
    // margin: 0 8px;
    margin-left: 10px;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      background-color: #e0e0e0;
    }

    &:deep(.ant-dropdown-trigger) {
      color: #333;
    }

    &:deep(.ant-dropdown-menu-group) {
      width: 200px;
      display: flex;
      flex-direction: column;
      margin-top: 10px;
      padding: 5px 10px;
      background-color: #ffffff;
      box-shadow: 1px 3px 8px 2px rgba(0, 0, 0, 0.25);
    }

    &:deep(.ant-dropdown-menu) {
      margin-right: 4px;
      background-color: unset;
      box-shadow: unset;
    }

    &:deep(.ant-dropdown-menu-group-item) {
      &:not(:last-child) {
        margin-bottom: 6px;
      }
    }
  }

  &__text {
    color: #7b7b7b;
  }

  &__col-empty {
    font-size: 12px;
  }
}

.workspace-activity-list {
  position: relative;
  height: calc(100% - #{$workspace-activity-header-height});
  overflow-y: scroll;

  &::-webkit-scrollbar {
    display: none;
  }

  &:deep(.ant-spin-spinning) {
    position: relative;

    display: flex;
    align-items: center;
    padding: 8px 18px;
    border-radius: 5px;
    background-color: $primary-blue;
  }

  &:deep(.ant-spin-text) {
    margin-left: 12px;
    color: #ffffff;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 2px;
  }

  &:deep(.ant-spin-dot-item) {
    background-color: #ffffff;
    opacity: 1;
  }
}

.list-item {
  &:not(:last-child) {
    margin-bottom: 12px;
  }

  &__row-activity {
    padding-left: 26px;
  }

  &__row-date {
    margin-bottom: 5px;
    color: #6b6b6b;
    font-size: 13px;
    font-weight: 600;
  }

  &__row-item {
    &:not(:last-child) {
      margin: 7px 0;
    }
  }

  &__row-item-time {
    font-size: 11.5px;
    letter-spacing: 0.5px;
  }
}

.loading-box {
  position: absolute;
  left: calc(50% - 45px);
  top: calc(50% - 18px);
}

.infinite-scroll-wrapper {
  height: 100%;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.empty-block {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.no-more-text {
  font-weight: 600;
  color: #ff9797;
}
</style>

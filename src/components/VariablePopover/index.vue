<template v-if="isVisible">
  <div :id="`${currentTabData.id}-popover-wrapper`" class="variable-popover-wrapper" @mouseenter="keepPopoverShow"
    @mouseleave="hidePopover">
    <div contenteditable="false" class="variable-popover" v-if="Object.keys(variableInfo).length === 0">
      <div class="variable-header">
        <div class="variable-header__icon">
          <!-- <warning-outlined two-tone-color="#eb2f96" /> -->
          <warning-two-tone two-tone-color="#FF2D2D" />
        </div>
        <div class="variable-header__name"><b>Unresolved Variable</b></div>
      </div>
      <div class="variable-content"> Make sure the variable is defined and enabled in the <u>active environment</u>,
        <u>collection</u> or <u>globals</u>
      </div>
    </div>
    <div class="variable-popover" v-else contenteditable="false">
      <div class="variable-header">
        <div class="variable-header__prefix"> {{ variableInfo.scopeType.slice(0, 1) }} </div>
        <div class="variable-header__name">{{ variableInfo.key }}</div>
      </div>
      <div class="variable-content">
        <div class="variable-content__row">
          <div class="variable-content__label">VALUE</div>
          <div class="variable-content__value"> {{ variableInfo.value }} </div>
          <div class="variable-content__operation" @click="copy(variableInfo.value)">
            <copy-outlined />
          </div>
        </div>
        <div class="variable-content__row">
          <div class="variable-content__label">CURRENT</div>
          <div class="variable-content__value"> {{ variableInfo.currentValue }} </div>
          <div class="variable-content__operation" @click="copy(variableInfo.currentValue)">
            <copy-outlined />
          </div>
        </div>
        <div class="variable-content__row">
          <div class="variable-content__label">SCOPE</div>
          <div class="variable-content__value"> {{ variableInfo.scopeType }} </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, toRefs, computed } from "vue";
import store from "@/store";
// import { clipboard } from "electron";

export default {
  props: {
    variableInfo: {
      type: Object,
      default: () => {},
    },
    content: {
      type: String,
      default: "",
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    variableId: {
      type: String,
      default: "",
    },
  },
  emits: {},

  setup(props, context) {

    const popover = ref();
    const { isVisible, variableInfo, variableId } = toRefs(props);

    const currentTabData = computed(() => {
      return store.getters.getCurrentTabData;
    });


    // const electron = window.require("electron");
    // const clipboard = electron.clipboard;

    const { clipboard } = require('electron');


    const copy = (text) => {
      clipboard.writeText(text);
    };

    const overlayStyle = ref({});

    onMounted(() => {});
    const keepPopoverShow = (e) => {};

    const hidePopover = () => {
      const popoverEl = document.getElementById(
        `${currentTabData.value.id}-popover-wrapper`
      );
      popoverEl.style.display = "none";
    };

    return {
      popover,
      copy,
      overlayStyle,
      keepPopoverShow,
      hidePopover,
      currentTabData,
    };
  },
};
</script>

<style lang="scss" scoped>
.variable-popover-wrapper {
  position: absolute;
  z-index: 2;
  top: 25px;
  left: 0;
  min-width: 280px;
  max-width: 350px;
  display: none;
  // background-color: #f2f2f2;
  // border-radius: 10px;
}

.variable-popover {
  margin-top: 5px;
  padding: 10px 0;
  background-color: #f2f2f2;
  border-radius: 10px;
}

.variable-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 0 10px;

  &__prefix {
    padding: 0px 6px;
    border-radius: 4px;
    color: #ffffff;
    background-color: rgb(48, 180, 48);
  }
}

.variable-content {
  padding: 10px;
  white-space: normal;

  &__row {
    display: flex;
    gap: 16px;
    font-size: 12px;
    // align-items: center;

    &:not(:last-child) {
      margin-bottom: 14px;
    }
  }

  &__label {
    min-width: 60px;
  }

  &__value {
    min-width: 160px;
    max-width: 200px;
    word-break: break-word;
  }

  &__operation {
    margin-left: auto;
    cursor: pointer;

    .anticon {
      font-size: 14px;
    }
  }
}
</style>

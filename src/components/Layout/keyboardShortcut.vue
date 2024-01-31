<template>
  <div
    class="keyboard-shortcut-wrapper"
    :class="[{ slide: showShortcut }, { hide: !showShortcut }]"
  >
    <div class="keyboard-shortcut-container">
      <span class="icon-close" @click="hideShortcut" />
      <div class="row row__header">
        <div class="row__header-item">Tab</div>
        <div class="row__header-item">Request</div>
        <div class="row__header-item">Sidebar</div>
        <div class="row__header-item">Window and modals</div>
        <div class="row__header-item">Table</div>
      </div>
      <div class="row row__content">
        <div
          class="row__content-item"
          v-for="item in shortcutList"
          :key="item.type"
        >
          <div
            class="row__content-block"
            v-for="(subItem, index) in item.keyboardList"
            :key="index"
          >
            <div class="row__content-col desc">
              {{ subItem.desc }}
            </div>
            <div class="row__content-col">
              <div
                class="row__content-row"
                v-for="(keyboardText, index) in subItem.keyboard"
                :key="index"
              >
                <div class="keyboard" v-if="keyboardText === 'Enter'">
                  <span class="icon-enter" />
                </div>
                <div class="keyboard" v-else>{{ keyboardText }}</div>
                <span
                  :class="{
                    slash:
                      item.type === 'Table' &&
                      index !== subItem.keyboard.length - 1,
                  }"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from "vue";
export default {
  components: {},
  props: {
    showShortcut: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    "hide-shortcut": null,
  },
  setup(props, context) {
    const shortcutList = reactive([
      {
        type: "Tab",
        keyboardList: [
          {
            desc: "Close Tab",
            keyboard: ["Ctrl", "W"],
          },
        ],
      },
      {
        type: "Request",
        keyboardList: [
          {
            desc: "Send Request",
            keyboard: ["Ctrl", "Enter"],
          },
          {
            desc: "Save Request",
            keyboard: ["Ctrl", "S"],
          },
          {
            desc: "Beautify",
            keyboard: ["Ctrl", "Shift", "F"],
          },
        ],
      },
      {
        type: "Sidebar",
        keyboardList: [
          {
            desc: "Delete Item",
            keyboard: ["Del"],
          },
          {
            desc: "Rename Item",
            keyboard: ["Ctrl", "E"],
          },
          {
            desc: "Duplicate Item",
            keyboard: ["Ctrl", "D "],
          },
        ],
      },
      {
        type: "Windows and modals",
        keyboardList: [
          {
            desc: "New...",
            keyboard: ["Ctrl", "N"],
          },
        ],
      },
      {
        type: "Table",
        keyboardList: [
          {
            desc: "Next Item",
            keyboard: ["→", "↓", "Tab"],
          },
          {
            desc: "Previus Item",
            keyboard: ["←", "↑"],
          },
        ],
      },
    ]);

    const hideShortcut = () => {
      context.emit("hide-shortcut");
    };
    return {
      shortcutList,
      hideShortcut,
    };
  },
};
</script>
<style lang="scss" scoped>
.slide {
  // bottom: -240px;
  animation: slide 0.8s forwards;
  // animation-delay: 1s;
  //opacity: 1;
}

.hide {
  bottom: -100%;
  animation: hide 0.8s forwards;
  //animation-delay: 0.5s;
  //opacity: 0;
}

@keyframes slide {
  0% {
    bottom: -240px;
    opacity: 0;
  }

  100% {
    bottom: 0;
    opacity: 1;
  }
}

@keyframes hide {
  0% {
    bottom: 0;
    // opacity: 1;
  }

  100% {
    bottom: -240px;
    // z-index: -1;
    opacity: 0;
  }
}

.keyboard-shortcut-wrapper {
  position: fixed;
  bottom: -100%;
  z-index: 100;
  width: 100%;
  height: 200px;
  background-color: $primary-white;
  box-shadow: 0 -5px 10px -3px $primary-dark-grey;
  opacity: 0;
}

.keyboard-shortcut-container {
  position: relative;
  height: 100%;
}

.row {
  &__header {
    display: grid;
    grid-template-columns: 13% 13% 13% 13% 13%;
    justify-content: space-evenly;
    padding: 7px 0 3px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid $secondary-light-grey;
    color: $primary-black;
  }

  &__content {
    height: calc(100% - 48px);
    display: grid;
    grid-template-columns: 13% 13% 13% 13% 13%;
    justify-content: space-evenly;
    padding: 10px 0;
  }

  &__content-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    color: $primary-black;
  }

  &__content-col {
    display: flex;
  }

  &__content-row {
    position: relative;
  }
}

.desc {
  font-size: 13px;
}

.keyboard {
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 12px;
  color: $primary-white;
  border-radius: 4px;
  background-color: $primary-blue;
  font-size: 12px;
}

.icon-close {
  position: absolute;
  top: 4px;
  right: 3px;
  width: 20px;
  height: 20px;
  margin-right: 9px;
  background-position-y: center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: url("~@/assets/img/footer/icon-close.png");
  cursor: pointer;

  &:hover {
    background-position-y: center;
    background-repeat: no-repeat;
    background-image: url("~@/assets/img/footer/icon-close-hover.png");
  }
}

.slash {
  &::after {
    position: absolute;
    top: 50%;
    right: -8px;
    transform: translateY(-50%);
    content: "/";
  }
}

.icon-enter {
  width: 100%;
  height: 100%;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: auto;
  background-image: url("~@/assets/img/footer/icon-enter.svg");
}
</style>

<template>
  <div class="response-tests-viewer">
    <div class="response-tests-viewer-tabs">
      <div class="tabs-wrapper">
        <div class="tabs-container">
          <div class="tab" :class="{'tab--selected':tab.label === selectedStatusLabel}" v-for="(tab, index) in statusTabs" :key="index" @click="changeTabs(tab)">{{tab.label}}</div>
        </div>

      </div>
    </div>
    <div class="response-tests-viewer-list">
      <!-- <div class="response-test-item">
        <div class="response-test-item__status response-test-item__status--fail">FAIL</div>
        <div class="response-test-item__text">Schema is valid | AssertionError: expected false to be true</div>
      </div>
      <div class="response-test-item">
        <div class="response-test-item__status response-test-item__status--pass">PASS</div>
        <div class="response-test-item__text">Status code is 200</div>
      </div> -->
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'

export default {
  setup () {
    const statusTabs = reactive([
      {
        label: 'All',
        isActive: false
      },
      {
        label: 'Passed',
        isActive: false
      },
      {
        label: 'Skipped',
        isActive: false
      },
      {
        label: 'Failed',
        isActive: false
      }
    ])

    const selectedStatusLabel = ref('')

    const changeTabs = (tab) => {
      selectedStatusLabel.value = tab.label
    }

    return {
      statusTabs,
      selectedStatusLabel,
      changeTabs
    }
  }
}

</script>

<style lang="scss" scoped>
.tabs-wrapper {
  padding-bottom: 10px;
}

.tabs-container {
  display: flex;
  align-items: center;
  width: fit-content;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.tab {
  padding: 8px 16px;
  font-size: $text-size-s;
  color: #6b6b6b;
  cursor: pointer;

  &--selected {
    color: #333;
    background-color: #e6e6e6;
  }

  &:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  &:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }
}

.response-test-item {
  display: flex;
  align-items: center;
  padding: 8px 4px;

  &__status {
    min-width: 40px;
    margin-right: 8px;
    padding: 3px;
    color: #fff;
    font-weight: 500;
    font-size: 10px;
    text-align: center;
    border-radius: 4px;
  }

  &__status--fail {
    background-color: #eb2013;
  }

  &__status--pass {
    background-color: #0cbb52;
  }

  &__text {
    font-size: 13px;
  }
}

</style>

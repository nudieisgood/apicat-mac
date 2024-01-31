<template>
  <div
    class="snippets-container"
    :class="{
      'snippets-container--scroll': tabInfo.tabType === TypeEnum.item.name,
    }"
  >
    <div class="snippet-header"></div>
    <div class="snippet-items">
      <div class="snippet-item-title">SNIPPETS</div>
      <div
        class="snippet-item"
        v-for="(item, index) in snippetList"
        :key="index"
        @click="item.function"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, watch } from "vue";
import tabsData from "@/store/tabs";
import TypeEnum, { typeList } from "@/js/enum/typeEnum";

export default {
  props: {
    eventType: {
      type: String,
      default: undefined,
    },
    tabInfo: {
      type: Object,
      default: () => {},
    },
  },
  emits: {
    "update-model-value": null,
    "insert-value": null,
  },

  setup(props, context) {
    const { eventType, tabInfo } = toRefs(props);
    const snippetList = reactive([
      {
        label: "Get an environment variable",
        function: () => {
          const string = 'om.environment.get("variable_key");';
          // addSnippet(string)
          insertValue(string);
        },
      },
      {
        label: "Get a global variable",
        function: () => {
          const string = 'om.globals.get("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Get a variable",
        function: () => {
          const string = 'om.variables.get("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Get a collection variable",
        function: () => {
          const string = 'om.collectionVariables.get("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Set an environment variable",
        function: () => {
          const string =
            'om.environment.set("variable_key", "variable_value");';
          insertValue(string);
        },
      },
      {
        label: "Set a global variable",
        function: () => {
          const string = 'om.globals.set("variable_key", "variable_value");';
          insertValue(string);
        },
      },
      {
        label: "Set a collection variable",
        function: () => {
          const string =
            'om.collectionVariables.set("variable_key", "variable_value");';
          insertValue(string);
        },
      },
      {
        label: "Clear an environment variable",
        function: () => {
          const string = 'om.environment.unset("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Clear a global variable",
        function: () => {
          const string = 'om.globals.unset("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Clear a collection variable",
        function: () => {
          const string = 'om.collectionVariables.unset("variable_key");';
          insertValue(string);
        },
      },
      {
        label: "Send a request",
        function: () => {
          const string = "om.sendRequest();";
          insertValue(string);
        },
      },
    ]);

    const addSnippet = (snippet) => {
      if (eventType.value === "prerequest") {
        const findPreRequest = tabInfo.value.event.find(
          (e) => e.listen === "prerequest"
        );

        if (findPreRequest) {
          findPreRequest.script.exec.push(snippet);
          findPreRequest.script.exec = findPreRequest.script.exec.filter(
            (d) => d
          );
          context.emit("update-model-value");
        }
      }
    };

    const insertValue = (snippet) => {
      context.emit("insert-value", snippet);
    };

    return {
      snippetList,
      addSnippet,
      tabsData,
      typeList,
      TypeEnum,
    };
  },
};
</script>

<style lang="scss" scoped>
.snippets-container {
  height: 100%;
  padding: 0 0 5px 8px;
  flex-basis: 20%;

  &--scroll {
    overflow-y: scroll;
  }
}

.snippet-item-title {
  margin-bottom: 12px;
  color: $primary-black;
  font-size: 14px;
  font-weight: 600;
}

.snippet-item {
  color: $link-blue;
  font-size: 12px;
  cursor: pointer;

  &:not(:last-child) {
    margin-bottom: 10px;
  }
}
</style>

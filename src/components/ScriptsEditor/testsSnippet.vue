<template>
  <div class="snippets-container" :class="{'snippets-container--scroll':tabInfo.tabType === typeList[2].name}">
    <div class="snippet-header">
      <!-- <p class="description">Test scripts are written in JavaScript, and are run after the response is received.</p> -->
    </div>
    <div class="snippet-items">
      <div class="snippet-item-title">SNIPPETS</div>
      <div class="snippet-item" v-for="(item, index) in snippetList" :key="index" @click="item.function">{{ item.label }}</div>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import tabsData from '@/store/tabs'
import { typeList } from '@/js/enum/typeEnum'

export default {
  props: {
    eventType: {
      type: String,
      default: undefined
    },
    tabInfo: {
      type: Object,
      default: () => {}
    }
  },
  emits: {
    'update-model-value': null,
    'insert-value': null
  },

  setup (props, context) {
    const { eventType, tabInfo } = toRefs(props)
    const snippetList = reactive([
      {
        label: 'Get an environment variable',
        function: () => {
          const string = 'om.environment.get("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Get a global variable',
        function: () => {
          const string = 'om.globals.get("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Get a variable',
        function: () => {
          const string = 'om.variables.get("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Get a collection variable',
        function: () => {
          const string = 'om.collectionVariables.get("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Set an environment variable',
        function: () => {
          const string = 'om.environment.set("variable_key", "variable_value");'
          insertValue(string)
        }
      },
      {
        label: 'Set a global variable',
        function: () => {
          const string = 'om.globals.set("variable_key", "variable_value");'
          insertValue(string)
        }
      },
      {
        label: 'Set a collection variable',
        function: () => {
          const string = 'om.collectionVariables.set("variable_key", "variable_value");'
          insertValue(string)
        }
      },
      {
        label: 'Clear an environment variable',
        function: () => {
          const string = 'om.environment.unset("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Clear a global variable',
        function: () => {
          const string = 'om.globals.unset("variable_key");'
          insertValue(string)
        }
      },
      {
        label: 'Clear a collection variable',
        function: () => {
          const string = 'om.collectionVariables.unset("variable_key");'
          insertValue(string)
        }
      },
      // {
      //   label: 'Send a request',
      //   function: () => {
      //     const string = 'om.sendRequest();'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Status code: Code is 200',
      //   function: () => {
      //     const string = 'om.test("Status code is 200", function () {\n om.response.to.have.status(200);\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response body: Contains string',
      //   function: () => {
      //     const string = 'om.test("Body matches string", function () {\n om.expect(om.response.text()).to.include("string_you_want_to_search");\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response body: JSON value check',
      //   function: () => {
      //     const string = 'om.test("Your test name", function () {\n var jsonData = om.response.json();\n om.expect(jsonData.value).to.eql(100);\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response body: Is equal to string',
      //   function: () => {
      //     const string = 'om.test("Body is correct", function () {\n om.response.to.have.body("response_body_string");\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response headers: Content-Type header check',
      //   function: () => {
      //     const string = 'om.test("Content-Type is present", function () {\n om.response.to.have.header("Content-Type");\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response time is less than 200ms',
      //   function: () => {
      //     const string = 'om.test("Response time is less than 200ms", function () {\n om.expect(om.response.responseTime).to.be.below(200);\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Status code: Successful POST request',
      //   function: () => {
      //     const string = 'om.test("Successful POST request", function () {\n om.expect(om.response.code).to.be.oneOf([201, 202]);\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Status code: Code name has string',
      //   function: () => {
      //     const string = 'om.test("Status code name has string", function () {\n om.response.to.have.status("Created");\n});'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Response body: Convert XML body to a JSON Object',
      //   function: () => {
      //     const string = 'var jsonObject = xml2Json(responseBody);'
      //     addSnippet(string)
      //   }
      // },
      // {
      //   label: 'Use Tiny Validator for JSON data',
      //   function: () => {
      //     const string = 'var schema = {\n "items": {\n "type": "boolean"\n }\n};\n\rvar data1 = [true, false];\nvar data2 = [true, 123];\n\rom.test("Schema is valid", function () {\n om.expect(tv4.validate(data1, schema)).to.be.true;\n om.expect(tv4.validate(data2, schema)).to.be.true;\n});'
      //     addSnippet(string)
      //   }
      // }
      {
        label: 'Get response',
        function: () => {
          const string = 'om.response.get();'
          insertValue(string)
        }
      }
    ])

    const addSnippet = (snippet) => {
      if (eventType.value === 'test') {
        const findTestsScript = tabInfo.value.event.find(e => e.listen === 'test')
        if (findTestsScript) {
          findTestsScript.script.exec.push(snippet)
          findTestsScript.script.exec = findTestsScript.script.exec.filter(d => d)
          context.emit('update-model-value')
        }
      }
    }

    const insertValue = (snippet) => {
      context.emit('insert-value', snippet)
    }

    return {
      snippetList,
      addSnippet,
      tabsData,
      typeList
    }
  }
}
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

.description {
  margin-bottom: 3px;
  font-size: 11px;
}
</style>

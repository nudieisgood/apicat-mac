import _ from '@/js/utils/om/util.js';
import _Property from '@/js/utils/om/property.js';
import _PropertyBase from '@/js/utils/om/propertyBase.js';
import _VariableList from '@/js/utils/om/variableList.js';
import store from "@/store";

/**
 *
 * @typedef VariableScope.definition
 * @property {String} [id] ID of the scope
 * @property {String} [name] A name of the scope
 * @property {Array.<Variable.definition>} [values] A list of variables defined in an array in form of `{name:String,
 * value:String}`
 *
 * @example <caption>JSON definition of a VariableScope (environment, globals, etc)</caption>
 * {
 *   "name": "globals",
 *   "values": [{
 *     "key": "var-1",
 *     "value": "value-1"
 *   }, {
 *     "key": "var-2",
 *     "value": "value-2"
 *   }]
 * }
 */

let MUTATIONS = {
  SET: 'set',
  UNSET: 'unset'
}

class VariableScope extends _Property {
  constructor(definition) {
    if (_.isArray(definition) || _VariableList.isVariableList(definition)) {
      definition = { values: definition };

    }
    super(definition);
    const values = definition && definition.values;
    this.values = values;
    // this.mutations = MUTATIONS
  }
}

Object.assign(VariableScope.prototype, {
  // 添加原型方法...
  _apicat_propertyRequiresId: true,
  get: function (key) {
    let text = key

    this.values.forEach((el) => {
      if (el.key === text) text = text.replace(el.key, el.value)

    })
    return text || key
  },
  set: function (key, value) {

    const obj = {
      key: key,
      value: value,
      type: 'default',
      disabled: false
    }
    const sameItem = this.values.find(e => e.key === key)
  if (sameItem) {
    sameItem.value = value
  } else {
    this.values.push(obj)
  }

  },
  unset: function(key) {
    const findVariableIndex = this.values.findIndex(e => e.key === key)
    if (findVariableIndex !== -1) {
      this.values.splice(findVariableIndex, 1)

    }
  }
});

Object.assign(VariableScope, {
  _apicat_propertyName: 'VariableScope',
  isVariableScope: function (obj) {
    return Boolean(obj) && ((obj instanceof isVariableScope) ||_.inSuperChain(obj.constructor, '_apicat_propertyName', VariableScope._apicat_propertyName));
  }
});

export default VariableScope;

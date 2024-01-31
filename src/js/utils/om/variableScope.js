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
    this.values = new _VariableList(this, _VariableList.isVariableList(values) ? values.toJSON() : values);
    this.mutations = MUTATIONS
  }
}

Object.assign(VariableScope.prototype, {
  // 添加原型方法...
  _apicat_propertyRequiresId: true,
  get: function (key) {
    let variable = this.values.oneNormalizedVariable(key);
    let i;
    let ii;

    // if a variable does not exist in local scope, we search all the layers and return the first occurrence.
    if ((!variable || variable.disabled === true) && this._layers) {
      for (i = 0, ii = this._layers.length; i < ii; i++) {
          variable = this._layers[i].oneNormalizedVariable(key);
          if (variable && variable.disabled !== true) { break; }
      }
    }
    return (variable && variable.disabled !== true) ? variable.valueOf() : undefined;
  },
  set: function (key, value) {

    let variable = this.values.oneNormalizedVariable(key);

    let update = {key, value} // 可能為更新既有的變數的值或新增新的變數

    if (variable && !variable.disabled) {
      variable.update(update)
    } else {
      this.values.add(update)

    }
  },
  unset: function(key) {
    let lastDisabledVariable;

    this.values.remove(function (variable) {
        // bail out if variable name didn't match
        if (variable.key !== key) {
            return false;
        }

        // don't delete disabled variables
        if (variable.disabled) {
            lastDisabledVariable = variable;

            return false;
        }

        // delete all enabled variables
        return true;
    });

    // restore the reference with the last disabled variable
    if (lastDisabledVariable) {
      this.values.reference[key] = lastDisabledVariable;
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

import _ from '@/js/utils/om/util.js';
import _Property from '@/js/utils/om/property.js';
import _Variable from '@/js/utils/om/variable.js';
import _PropertyList from '@/js/utils/om/propertyList.js';

class VariableList extends _PropertyList {
  constructor(parent, populate) {
    super(_Variable, parent, populate);
  }
}

Object.assign(VariableList.prototype, {
  // 添加原型方法...
  oneNormalizedVariable (variableName) {
    let indexKey = this._apicat_listIndexKey // `key` for Variable
    let variable = this.reference[variableName]
    let i;

    if (variable && !variable.disabled) {
      return variable;
    }

    // traverse the members list in reverse direction in order to find the last enabled
    for (i = this.members.length - 1; i >= 0; i--) {
      variable = this.members[i];
      if (variable[indexKey] === variableName && !variable.disabled) {
          // update the input variable reference if comparison is not disabled
          this.reference[variableName] = variable;
          break; // return updated reference variable
      }
    }

    return this.reference[variableName];
}
});

Object.assign(VariableList, {
  _apicat_propertyName: 'VariableList',
  isVariableList: function (obj) {
    return Boolean(obj) && ((obj instanceof VariableList) ||_.inSuperChain(obj.constructor, '_apicat_propertyName', VariableList._apicat_propertyName));
  }
});

export default VariableList;

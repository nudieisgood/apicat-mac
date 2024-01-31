import _ from '@/js/utils/om/util.js';
import _Property from '@/js/utils/om/property.js';

let E = ''
let ANY = 'any'
let NULL = 'null'
let STRING = 'string'
// let Variable;


/**
 * @example
 * {
 *   "id": "my-var-1",
 *   "name": "MyFirstVariable",
 *   "value": "Hello World",
 *   "type": "string"
 * }
 */
// _.inherit((
//   Variable = function ApicatVariable (definition) {}
// ))

class Variable extends _Property {
  constructor(definition) {
    super(definition);
    var indexer = this.constructor._apicat_propertyIndexKey;
    _.assign(this, {
      type: ANY,
      value: undefined
    })
    if (!_.isNil(definition)) { // 檢查是否為 null 或 undefined
      _.has(definition, indexer) && (this[indexer] = definition[indexer]);
      this.update(definition);
    }
  }
}

Object.assign(Variable.prototype, {
  // 添加原型方法...
  get () {
    return _.isFunction(this.value) ? this.castOut(this.value()) : this.castOut(this.value);
  },
  set (value) {
    // @todo - figure out how secure is this!
    this.value = _.isFunction(value) ? value : this.castIn(value);
  },
  valueOf (value) {
    arguments.length && this.set(value); // 不確定判斷用途
    return this.get();
  },
  valueType (typeName, _noCast) {

    !_.isNil(typeName) && (typeName = typeName.toString().toLowerCase()); // sanitize
    if (!Variable.types[typeName]) {
        return this.type || ANY; // @todo: throw new Error('Invalid variable type.');
    }

    // set type if it is valid
    this.type = typeName;

    // 1. get the current value
    // 2. set the new type if it is valid and cast the stored value
    // 3. then set the interstitial value
    var interstitialCastValue;

    // do not touch value functions
    if (!(_noCast || _.isFunction(this.value))) {
        interstitialCastValue = this.get();
        this.set(interstitialCastValue);
        interstitialCastValue = null; // just a precaution
    }

    return this.type;
  },
  castIn (value) {
    var handler = Variable.types[this.type] || Variable.types.any;
    return _.isFunction(handler) ? handler(value) : handler.in(value);
  },
  castOut (value) {
    /**
     * 依據 type 回傳對應的值
     */
    var handler = Variable.types[this.type] || Variable.types.any;
    return _.isFunction(handler) ? handler(value) : handler.out(value);
  },
  update (options) {
    if (!_.isObject(options)) {
        return;
    }
    // set type and value.
    // @note that we cannot update the key, once created during construction
    _.has(options, 'type') && this.valueType(options.type, _.has(options, 'value'));
    _.has(options, 'value') && this.set(options.value);
    _.has(options, 'system') && (this.system = options.system);
    _.has(options, 'disabled') && (this.disabled = options.disabled);
    // _.has(options, 'description') && (this.describe(options.description));
  }
});

Object.assign(Variable, {
  _apicat_propertyName: 'Variable',
  _apicat_propertyIndexKey: 'key',
  types: {
    string: String,
    any: {
      /**
       * @param {*} val -
       * @returns {*}
       */
      in (val) {
          return val; // pass through
      },

      /**
       * @param {*} val -
       * @returns {*}
       */
      out (val) {
          return val; // pass through
      }
  }
  },
  isVariable: function (obj) {
    return Boolean(obj) && ((obj instanceof Variable) ||
      _.inSuperChain(obj.constructor, '_apicat_propertyName', Variable._apicat_propertyName));
  }
});

export default Variable;

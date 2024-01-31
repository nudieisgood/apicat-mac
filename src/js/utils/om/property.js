import _ from '@/js/utils/om/util.js'; // lodash
import _PropertyBase from '@/js/utils/om/propertyBase.js';

// let Property

// _.inherit((
//   Property = function ApicatProperty () {
//     Property.super_.apply(this, arguments);
//   }
// ), _PropertyBase)

// _.assign(Property.prototype, {

// })

// _.assign(Property, {
//   _apicat_propertyName: 'Property',
// })

// export default Property;

class Property extends _PropertyBase {
  constructor(definition) {
    super(definition);
    // console.log('Property definition__', definition)
    let id = definition && definition.id ? definition.id : Date.now()
    id && (this.id = id);
    definition.name && (this.name = definition.name)

  }
}

Object.assign(Property.prototype, {
  // 添加原型方法...

});

Object.assign(Property, {
  _apicat_propertyName: 'Property',
});

export default Property;

import _ from '@/js/utils/om/util.js';
import _PropertyList from '@/js/utils/om/propertyList.js';
import Header from '@/js/utils/om/header.js'

let PROP_NAME = '_apicat_propertyName'

class HeaderList extends _PropertyList {
  constructor(parent, headers) {
    super(Header, parent, headers);

  }
}

Object.assign(HeaderList.prototype, {
  contentSize () {
    if (!this.count()) { return 0; }
    return Header.unparse(this).length;
  }
})

Object.assign(HeaderList, {
  _apicat_propertyName: 'HeaderList',
  // isHeaderList: function (obj) {
  //   return Boolean(obj) && ((obj instanceof HeaderList) || _.inSuperChain(obj.constructor, PROP_NAME, HeaderList._apicat_propertyName));
  // }
})

export default HeaderList

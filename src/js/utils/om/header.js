import _ from '@/js/utils/om/util.js'; // lodash
import _PropertyList from '@/js/utils/om/propertyList.js';
import _Property from '@/js/utils/om/property.js';

class Header extends _Property {
  constructor(options, name) {
    super(options, name)
    this.update(options);
  }
}

Object.assign(Header.prototype, {
  update (options) {
    this.key = _.get(options, 'key') || '';
    this.value = _.get(options, 'value') || '';

  },
})

Object.assign(Header, {
  _apicat_propertyName: 'Header',
  _apicat_propertyIndexKey: 'key',
  parse: function (headerString) {
    var headers = [],
        regexes = {
            header: /^(\S+):(.*)$/gm,
            fold: /\r\n([ \t])/g,
            trim: /^\s*(.*\S)?\s*$/
        },
        match = regexes.header.exec(headerString);

    headerString = headerString.toString().replace(regexes.fold, '$1');

    while (match) {
        headers.push({
            key: match[1],
            value: match[2].replace(regexes.trim, '$1')
        });
        match = regexes.header.exec(headerString);
    }

    return headers;
  },
  unparse: function (headers, separator = CRLF) {
    if (!_.isArray(headers) && !_PropertyList.isPropertyList(headers)) {
        return E;
    }

    return headers.reduce(function (acc, header) {
        if (header && !header.disabled) {
            acc += Header.unparseSingle(header) + separator;
        }

        return acc;
    }, E);
  }
});


export default Header;

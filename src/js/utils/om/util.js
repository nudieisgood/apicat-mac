// let _ = require('lodash').noConflict()
// let _ = require('lodash-es')
import _ from 'lodash-es';
// console.log('lodash-es__', require('lodash-es'))

let util;

_.mixin({
  inherit (child, base) {
    Object.defineProperty(child, 'super_', {
        value: _.isFunction(base) ? base : _.noop,
        configurable: false,
        enumerable: false,
        writable: false
    });

    child.prototype = Object.create((_.isFunction(base) ? base.prototype : base), {
        constructor: {
            value: child,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    return child;
  },

  mergeDefined (target, source) {
    var key;

    for (key in source) {
        if (_.has(source, key) && !_.isUndefined(source[key])) {
            target[key] = source[key];
        }
    }

    return target;
  },
  choose () {
    for (var i = 0, ii = arguments.length; i < ii; i++) {
        if (!_.isEmpty(arguments[i])) {
            return arguments[i];
        }
    }
  },
  ensureEncoded (string) {
    // Takes care of the case where the string is already encoded.
    try {
        string = decodeURIComponent(string);
    }
    catch (e) {} // eslint-disable-line no-empty

    try {
        return encodeURIComponent(string);
    }
    // handle malformed URI sequence
    // refer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Malformed_URI
    catch (error) {
        return string;
    }
  },
  assignHidden (obj, name, prop) {
    Object.defineProperty(obj, name, {
        value: prop,
        configurable: true,
        enumerable: false,
        writable: true
    });

    return obj;
  },
  getOwn (obj, prop, def) {
    return _.has(obj, prop) ? obj[prop] : def;
  },
  inSuperChain (obj, key, value) {
    return obj ? ((obj[key] === value) || _.inSuperChain(obj.super_, key, value)) : false;
  },
})

util = {
  lodash: _
}

export default _;
// module.exports = _;
// module.exports = util;

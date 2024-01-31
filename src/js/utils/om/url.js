import _ from '@/js/utils/om/util.js';
import _PropertyBase from '@/js/utils/om/propertyBase.js';
import _PropertyList from '@/js/utils/om/propertyList.js';

class Url extends _PropertyBase {
  /**
   * Defines a URL.
   *
   * @constructor
   * @extends {PropertyBase}
   * @param {Object|String} options -
   */

  constructor(options) {
    super(options);
    // create the url properties
    this.update(options);

  }
}

Object.assign(Url.prototype, {
  update (url) {
    !url && (url = E);
    var parsedUrl = _.isString(url) ? Url.parse(url) : url,
        auth = parsedUrl.auth,
        protocol = parsedUrl.protocol,
        port = parsedUrl.port,
        path = parsedUrl.path,
        hash = parsedUrl.hash,
        host = parsedUrl.host,
        query = parsedUrl.query,
        variable = parsedUrl.variable;

    // convert object based query string to array
    // @todo: create a key value parser
    if (query) {
      // if (_.isString(query)) {
      //     query = QueryParam.parse(query);
      // }

      // if (!_.isArray(query) && _.keys(query).length) {
      //     query = _.map(_.keys(query), function (key) {
      //         return {
      //             key: key,
      //             value: query[key]
      //         };
      //     });
      // }
    }

    // backward compatibility with path variables being storing thins with `id`
    if (_.isArray(variable)) {
      variable = _.map(variable, function (v) {
          _.isObject(v) && (v.key = v.key || v.id); // @todo Remove once path variables are deprecated

          return v;
      });
    }

    // expand string path name
    if (_.isString(path)) {
      path && (path = path.replace(regexes.trimPath, MATCH_1)); // remove leading slash for valid path
      // if path is blank string, we set it to undefined, if '/' then single blank string array
      path = path ? (path === PATH_SEPARATOR ? [E] : path.split(PATH_SEPARATOR)) : undefined;
    }

    // expand host string
    _.isString(host) && (host = host.split(regexes.splitDomain));

    _.assign(this, /** @lends Url.prototype */ {
      /**
       * @type {{ user: String, password: String }}
       */
      auth: auth,

      /**
       * @type {String}
       */
      protocol: protocol,

      /**
       * @type {String}
       */
      port: port,

      /**
       * @type {Array<String>}
       */
      path: path,

      /**
       * @type {String}
       */
      hash: hash,

      /**
       * @type {Array<String>}
       */
      host: host,

      /**
       * @type {PropertyList<QueryParam>}
       *
       * @todo consider setting this as undefined in v4 otherwise it's
       * difficult to detect URL like `localhost/?`.
       * currently it's replying upon a single member with empty key.
       */
      // query: new _PropertyList(QueryParam, this, query || []),

      /**
       * @type {VariableList}
       */
      // variables: new VariableList(this, variable || [])
    });
  },
})

Object.assign(Url, {
  parse: function (url) {
    // url = url_parse(url);

    // var pathVariables,
    //     pathVariableKeys = {};

    // if (url.auth) {
    //     url.auth = {
    //         user: url.auth[0],
    //         password: url.auth[1]
    //     };
    // }

    // if (url.query) {
    //     url.query = url.query.map(QueryParam.parseSingle);
    // }

    // // extract path variables
    // pathVariables = _.transform(url.path, function (res, segment) {
    //   if ((segment = parsePathVariable(segment)) && !pathVariableKeys[segment]) {
    //       pathVariableKeys[segment] = true;
    //       res.push({ key: segment });
    //   }
    // }, []);
    // url.variable = pathVariables.length ? pathVariables : undefined;

    return url;
  },
})


export default Url;

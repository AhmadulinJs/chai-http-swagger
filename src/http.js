/* eslint-disable  */
/*!
 * chai-http
 * Copyright(c) 2011-2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ## Assertions
 *
 * The Chai HTTP module provides a number of assertions
 * for the `expect` and `should` interfaces.
 */
const cache = require('./cache');

module.exports = function (chai, _) {
  chai.Assertion.includeStack = true

  /*!
   * Module dependencies.
   */

  var net = require('net');
  var qs = require('qs');
  var url = require('url');
  var Cookie = require('cookiejar');
  var charset = require("charset");
  const querString = require('querystring')
  /*!
   * Aliases.
   */

  var Assertion = chai.Assertion
    , i = _.inspect;
  /*!
   * Expose request builder
   */
  const rq = require('./request');
  // chai.request = require('./request');
  const request = (conf) => {
    // conf.app.req.description = conf.description
    conf.app.description = conf.description
    conf.method = conf.method.toLowerCase()
    let pathParams

    if (conf.params && conf.params.path) {
      pathParams = { ...conf.params.path };
    }
    const paramsMatch = /\:([\w_-\d]+)/g
    const pathMatch = [...conf.path.matchAll(paramsMatch)]
    let parsedUrl = url.parse(conf.path);
    let relativePath = parsedUrl.pathname;
    let absolutePath = parsedUrl.pathname;

    const qrs = { ...querString.parse(parsedUrl.query) }

    pathMatch.forEach((pathParam) => {
      relativePath = relativePath.replace(pathParam[0], `{${pathParam[1]}}`)
      absolutePath = absolutePath.replace(pathParam[0], pathParams[pathParam[1]])
    })
    let security = {}
    let securityKeys = []
    const requestData = {}
    requestData[relativePath] = {}
    requestData[relativePath][conf.method] = {
      description: conf.description,
      request: {
        security,
        body: {},
        header: {
          // 
        },
      }
    }

    if (conf.security && Object.keys(conf.security).length > 0) {
      security = conf.security;
      securityKeys = Object.keys(security);
      requestData[relativePath][conf.method].request.security = security
    }

    const requestObj = rq(conf.app, { relativePath })
    let temp;

    Object.keys(requestObj).forEach(methodName => {

      if (methodName == conf.method) {

        if (methodName === 'post' || methodName === 'put') {
          if (conf.body) {

            if (conf.body.json) {
              requestData[relativePath][conf.method].request = {
                ...requestData[relativePath][conf.method].request,
                body: conf.body.json,
                header: {
                  'Content-Type': 'application/json'
                }
              }
              temp = requestObj[methodName](absolutePath)
              securityKeys.forEach((key) => {
                temp = temp.set(key, security[key])
              })
              temp = temp.set('user-agent', 'node-superagent/3.8.3')
              temp = temp.send(conf.body.json)
            }
            else if (conf.body.formData) {
              temp = requestObj[methodName](absolutePath)
              securityKeys.forEach((key) => {
                temp = temp.set(key, security[key])
              })
              temp = temp.set('user-agent', 'node-superagent/3.8.3')
              let bodyData = {}
              let attachments = {}
              let formData = conf.body.formData
              for (let key in formData) {
                if (key === 'attachments') {
                  for (let fileInputName in formData['attachments']) {

                    bodyData[fileInputName] = {
                      type: 'file'
                    }
                    attachments[fileInputName] = formData['attachments'][fileInputName]
                  }

                }
                else {
                  temp['field'](key, formData[key])
                  bodyData[key] = formData[key]
                }
              }

              for (let attachmentKey in attachments) {
                temp['attach'](attachmentKey, attachments[attachmentKey][0], attachments[attachmentKey][1])
              }
              requestData[relativePath][conf.method].request = {
                ...requestData[relativePath][conf.method].request,
                body: bodyData,
                header: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            }
          }
          else {
            requestData[relativePath][conf.method].request = {
              ...requestData[relativePath][conf.method].request,
              body: conf.body.json,
              header: {
                'Content-Type': 'application/json'
              }
            }
            temp = requestObj[methodName](absolutePath)
            securityKeys.forEach((key) => {
              temp = temp.set(key, security[key])
            })
            temp = temp.set('user-agent', 'node-superagent/3.8.3')
            temp = temp.send(conf.body.json)
          }
        }
        else {
          temp = requestObj[methodName](absolutePath)
          securityKeys.forEach((key) => {
            temp = temp.set(key, security[key])
          })
          temp = temp.set('user-agent', 'node-superagent/3.8.3')
        }
        if (requestData[relativePath][conf.method] && requestData[relativePath][conf.method].request) {

          requestData[relativePath][conf.method].request.header = {
            ...requestData[relativePath][conf.method].request.header,
          }
          requestData[relativePath][conf.method].request.header['user-agent'] = 'node-superagent/3.8.3'
        }
      }
      else {
      }

    });
    requestData[relativePath][conf.method].request.queryParams = qrs


    // console.log('CHAI DATA')
    // // console.log(Object.keys(chai))
    // console.log(chai)
    // console.log('CHAI DATA')
    // setTimeout(() => {
    //   console.log('CHAI DATA')
    //   console.log(Object.keys(conf.app))
    //   console.log('CHAI DATA')
    // }, 1)

    // cache.setRequest(requestData)
    cache.setRequestResponse(requestData)
    temp.app.description = conf.description;
    // console.log(temp)

    return temp;
  }

  if (cache.getCallerName()) {
    if (!chai[cache.getCallerName()]) {
      chai[cache.getCallerName()] = request
    }
    else {
      chai.request = request
    }
  } else {
    chai.request = request
  }
  /*!
   * Content types hash. Used to
   * define `Assertion` properties.
   *
   * @type {Object}
   */

  var contentTypes = {
    json: 'application/json'
    , text: 'text/plain'
    , html: 'text/html'
  };

  /*!
   * Return a header from `Request` or `Response` object.
   *
   * @param {Request|Response} object
   * @param {String} Header
   * @returns {String|Undefined}
   */

  function getHeader(obj, key) {
    if (key) key = key.toLowerCase();
    if (obj.getHeader) return obj.getHeader(key);
    if (obj.headers) return obj.headers[key];
  };

  /**
   * ### .status (code)
   *
   * Assert that a response has a supplied status.
   *
   * ```js
   * expect(res).to.have.status(200);
   * ```
   *
   * @param {Number} status number
   * @name status
   * @api public
   */

  Assertion.addMethod('status', function (code) {
    var hasStatus = Boolean('status' in this._obj || 'statusCode' in this._obj);
    new Assertion(hasStatus).assert(
      hasStatus
      , "expected #{act} to have keys 'status', or 'statusCode'"
      , null // never negated
      , hasStatus // expected
      , this._obj // actual
      , false // no diff
    );

    var status = this._obj.status || this._obj.statusCode;

    this.assert(
      status == code
      , 'expected #{this} to have status code #{exp} but got #{act}'
      , 'expected #{this} to not have status code #{act}'
      , code
      , status
    );
  });

  /**
   * ### .header (key[, value])
   *
   * Assert that a `Response` or `Request` object has a header.
   * If a value is provided, equality to value will be asserted.
   * You may also pass a regular expression to check.
   *
   * __Note:__ When running in a web browser, the
   * [same-origin policy](https://tools.ietf.org/html/rfc6454#section-3)
   * only allows Chai HTTP to read
   * [certain headers](https://www.w3.org/TR/cors/#simple-response-header),
   * which can cause assertions to fail.
   *
   * ```js
   * expect(req).to.have.header('x-api-key');
   * expect(req).to.have.header('content-type', 'text/plain');
   * expect(req).to.have.header('content-type', /^text/);
   * ```
   *
   * @param {String} header key (case insensitive)
   * @param {String|RegExp} header value (optional)
   * @name header
   * @api public
   */

  Assertion.addMethod('header', function (key, value) {
    var header = getHeader(this._obj, key);

    if (arguments.length < 2) {
      this.assert(
        'undefined' !== typeof header || null === header
        , 'expected header \'' + key + '\' to exist'
        , 'expected header \'' + key + '\' to not exist'
      );
    } else if (arguments[1] instanceof RegExp) {
      this.assert(
        value.test(header)
        , 'expected header \'' + key + '\' to match ' + value + ' but got ' + i(header)
        , 'expected header \'' + key + '\' not to match ' + value + ' but got ' + i(header)
        , value
        , header
      );
    } else {
      this.assert(
        header == value
        , 'expected header \'' + key + '\' to have value ' + value + ' but got ' + i(header)
        , 'expected header \'' + key + '\' to not have value ' + value
        , value
        , header
      );
    }
  });

  /**
   * ### .headers
   *
   * Assert that a `Response` or `Request` object has headers.
   *
   * __Note:__ When running in a web browser, the
   * [same-origin policy](https://tools.ietf.org/html/rfc6454#section-3)
   * only allows Chai HTTP to read
   * [certain headers](https://www.w3.org/TR/cors/#simple-response-header),
   * which can cause assertions to fail.
   *
   * ```js
   * expect(req).to.have.headers;
   * ```
   *
   * @name headers
   * @api public
   */

  Assertion.addProperty('headers', function () {
    this.assert(
      this._obj.headers || this._obj.getHeader
      , 'expected #{this} to have headers or getHeader method'
      , 'expected #{this} to not have headers or getHeader method'
    );
  });

  /**
   * ### .ip
   *
   * Assert that a string represents valid ip address.
   *
   * ```js
   * expect('127.0.0.1').to.be.an.ip;
   * expect('2001:0db8:85a3:0000:0000:8a2e:0370:7334').to.be.an.ip;
   * ```
   *
   * @name ip
   * @api public
   */

  Assertion.addProperty('ip', function () {
    this.assert(
      net.isIP(this._obj)
      , 'expected #{this} to be an ip'
      , 'expected #{this} to not be an ip'
    );
  });

  /**
   * ### .json / .text / .html
   *
   * Assert that a `Response` or `Request` object has a given content-type.
   *
   * ```js
   * expect(req).to.be.json;
   * expect(req).to.be.html;
   * expect(req).to.be.text;
   * ```
   *
   * @name json
   * @name html
   * @name text
   * @api public
   */

  function checkContentType(name) {
    var val = contentTypes[name];

    Assertion.addProperty(name, function () {
      new Assertion(this._obj).to.have.headers;
      var ct = getHeader(this._obj, 'content-type')
        , ins = i(ct) === 'undefined'
          ? 'headers'
          : i(ct);

      this.assert(
        ct && ~ct.indexOf(val)
        , 'expected ' + ins + ' to include \'' + val + '\''
        , 'expected ' + ins + ' to not include \'' + val + '\''
      );
    });
  }

  Object
    .keys(contentTypes)
    .forEach(checkContentType);

  /**
   * ### .charset
   *
   * Assert that a `Response` or `Request` object has a given charset.
   *
   * ```js
   * expect(req).to.have.charset('utf-8');
   * ```
   *
   * @name charset
   * @api public
   */

  Assertion.addMethod('charset', function (value) {
    value = value.toLowerCase();

    var headers = this._obj.headers;
    var cs = charset(headers);

    /*
     * Fix charset() treating "utf8" as a special case
     * See https://github.com/node-modules/charset/issues/12
     */
    if (cs === "utf8") {
      cs = "utf-8";
    }

    this.assert(
      cs != null && value === cs
      , 'expected content type to have ' + value + ' charset'
      , 'expected content type to not have ' + value + ' charset'
    )
  });

  /**
   * ### .redirect
   *
   * Assert that a `Response` object has a redirect status code.
   *
   * ```js
   * expect(res).to.redirect;
   * ```
   *
   * @name redirect
   * @api public
   */

  Assertion.addProperty('redirect', function () {
    var redirectCodes = [301, 302, 303, 307, 308]
      , status = this._obj.status
      , redirects = this._obj.redirects;

    this.assert(
      redirectCodes.indexOf(status) >= 0 || redirects && redirects.length
      , "expected redirect with 30X status code but got " + status
      , "expected not to redirect but got " + status + " status"
    );
  });

  /**
   * ### .redirectTo
   *
   * Assert that a `Response` object redirects to the supplied location.
   *
   * ```js
   * expect(res).to.redirectTo('http://example.com');
   * ```
   *
   * @param {String|RegExp} location url
   * @name redirectTo
   * @api public
   */

  Assertion.addMethod('redirectTo', function (destination) {
    var redirects = this._obj.redirects;

    new Assertion(this._obj).to.redirect;

    if (redirects && redirects.length) {
      var hasRedirected;

      if (Object.prototype.toString.call(destination) === '[object RegExp]') {
        hasRedirected = redirects.some(redirect => destination.test(redirect));

      } else {
        hasRedirected = redirects.indexOf(destination) > -1;
      }
      this.assert(
        hasRedirected
        , 'expected redirect to ' + destination + ' but got ' + redirects.join(' then ')
        , 'expected not to redirect to ' + destination + ' but got ' + redirects.join(' then ')
      );
    } else {
      var assertion = new Assertion(this._obj);
      _.transferFlags(this, assertion);
      assertion.with.header('location', destination);
    }
  });

  /**
   * ### .param
   *
   * Assert that a `Request` object has a query string parameter with a given
   * key, (optionally) equal to value
   *
   * ```js
   * expect(req).to.have.param('orderby');
   * expect(req).to.have.param('orderby', 'date');
   * expect(req).to.not.have.param('limit');
   * ```
   *
   * @param {String} parameter name
   * @param {String} parameter value
   * @name param
   * @api public
   */

  Assertion.addMethod('param', function (name, value) {
    var assertion = new Assertion();
    _.transferFlags(this, assertion);
    assertion._obj = qs.parse(url.parse(this._obj.url).query);
    assertion.property.apply(assertion, arguments);
  });

  /**
   * ### .cookie
   *
   * Assert that a `Request`, `Response` or `Agent` object has a cookie header with a
   * given key, (optionally) equal to value
   *
   * ```js
   * expect(req).to.have.cookie('session_id');
   * expect(req).to.have.cookie('session_id', '1234');
   * expect(req).to.not.have.cookie('PHPSESSID');
   * expect(res).to.have.cookie('session_id');
   * expect(res).to.have.cookie('session_id', '1234');
   * expect(res).to.not.have.cookie('PHPSESSID');
   * expect(agent).to.have.cookie('session_id');
   * expect(agent).to.have.cookie('session_id', '1234');
   * expect(agent).to.not.have.cookie('PHPSESSID');
   * ```
   *
   * @param {String} parameter name
   * @param {String} parameter value
   * @name param
   * @api public
   */

  Assertion.addMethod('cookie', function (key, value) {
    var header = getHeader(this._obj, 'set-cookie')
      , cookie;

    if (!header) {
      header = (getHeader(this._obj, 'cookie') || '').split(';');
    }

    if (this._obj instanceof chai.request.agent && this._obj.jar) {
      cookie = this._obj.jar.getCookie(key, Cookie.CookieAccessInfo.All);
    } else {
      cookie = Cookie.CookieJar();
      cookie.setCookies(header);
      cookie = cookie.getCookie(key, Cookie.CookieAccessInfo.All);
    }

    if (arguments.length === 2) {
      this.assert(
        cookie.value == value
        , 'expected cookie \'' + key + '\' to have value #{exp} but got #{act}'
        , 'expected cookie \'' + key + '\' to not have value #{exp}'
        , value
        , cookie.value
      );
    } else {
      this.assert(
        'undefined' !== typeof cookie || null === cookie
        , 'expected cookie \'' + key + '\' to exist'
        , 'expected cookie \'' + key + '\' to not exist'
      );
    }
  });



};
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _effect = _interopRequireWildcard(require("../../defaults/effect"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function fetch(body) {
  return Promise.resolve({
    ok: true,
    headers: {
      get: jest.fn(function () {
        return 'application/json';
      })
    },
    text: jest.fn(function () {
      return Promise.resolve(body);
    })
  });
}

var globalFetch;
beforeAll(function () {
  globalFetch = global.fetch;
});
afterAll(function () {
  global.fetch = globalFetch;
});
test('effector accept JSON stringified object', function () {
  var body = {
    email: 'email@example.com',
    password: 'p4ssw0rd'
  };
  global.fetch = jest.fn(function (url, options) {
    expect(options.headers['content-type']).toEqual('application/json');
    expect(JSON.parse(options.body)).toEqual(body);
    return fetch('');
  });
  return (0, _effect.default)({
    body: JSON.stringify(body)
  }).then(function (body2) {
    expect(body2).toEqual(null);
  });
});
test('effector accept JSON object', function () {
  var json = {
    email: 'email@example.com',
    password: 'p4ssw0rd'
  };
  global.fetch = jest.fn(function (url, options) {
    expect(options.headers['content-type']).toEqual('application/json');
    expect(JSON.parse(options.body)).toEqual(json);
    return fetch('');
  });
  return (0, _effect.default)({
    json: json
  }).then(function (body2) {
    expect(body2).toEqual(null);
  });
});
test('effector rejects invalid JSON object', function () {
  var circularObject = {};
  circularObject.self = circularObject;
  return (0, _effect.default)({
    json: circularObject
  }).catch(function (error) {
    expect(error).toBeInstanceOf(TypeError);
  });
});
test('effector receive JSON and response objects', function () {
  var body = {
    id: 1234
  };
  global.fetch = jest.fn(function () {
    return fetch(JSON.stringify(body));
  });
  return (0, _effect.default)({}).then(function (body2) {
    expect(body2).toEqual(body);
  });
});
test('effector accepts content-type and Content-Type headers', function () {
  var otherHeaders = {
    'other-one': 'other-one',
    'other-two': 'other-two'
  };
  var formUrlEncoded = 'application/x-www-form-urlencoded';
  var noHeaders = undefined;

  var capitalizedHeaders = _objectSpread({
    'Content-Type': formUrlEncoded
  }, otherHeaders);

  var lowerCasedHeaders = _objectSpread({
    'content-type': formUrlEncoded
  }, otherHeaders);

  expect((0, _effect.getHeaders)(noHeaders)).toEqual({
    'content-type': 'application/json'
  });
  expect((0, _effect.getHeaders)(capitalizedHeaders)).toEqual(_objectSpread({
    'content-type': formUrlEncoded
  }, otherHeaders));
  expect((0, _effect.getHeaders)(lowerCasedHeaders)).toEqual(_objectSpread({
    'content-type': formUrlEncoded
  }, otherHeaders));
});
test('effector receives object as multipart/form-data', function () {
  var body = new FormData();
  body.append('id', 1234);
  body.append('name', 'john');
  body.forEach(function (value, key) {
    body[key] = value;
  });
  global.fetch = jest.fn(function (url, options) {
    expect(options.headers['content-type']).toEqual('multipart/form-data');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('id')).toBe('1234');
    return fetch('');
  });
  return (0, _effect.default)({
    body: body,
    headers: {
      'content-type': 'multipart/form-data'
    }
  }).then(function (body2) {
    expect(body2).toEqual(null);
  });
});
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _discard = _interopRequireDefault(require("../../defaults/discard"));

test('discards non-http error', function () {
  var error = {
    message: 'Non-http error'
  };
  var action = {
    type: 'DISCARD',
    meta: {
      offline: {
        effect: {}
      }
    }
  };
  expect((0, _discard.default)(error, action)).toEqual(true);
});
test('discards http 4xx errors', function () {
  var error = {
    status: 404
  };
  var action = {
    type: 'DISCARD',
    meta: {
      offline: {
        effect: {}
      }
    }
  };
  expect((0, _discard.default)(error, action)).toEqual(true);
});
test('does not discard http 5xx errors', function () {
  var error = {
    status: 500
  };
  var action = {
    type: 'DISCARD',
    meta: {
      offline: {
        effect: {}
      }
    }
  };
  expect((0, _discard.default)(error, action)).toEqual(false);
});
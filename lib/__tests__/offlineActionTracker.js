"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _offlineActionTracker2 = _interopRequireDefault(require("../offlineActionTracker.js"));

var _offlineActionTracker = _offlineActionTracker2.default.withPromises,
    registerAction = _offlineActionTracker.registerAction,
    resolveAction = _offlineActionTracker.resolveAction,
    rejectAction = _offlineActionTracker.rejectAction;
test('resolves first action with correct transaction', function () {
  var transaction = 0;
  var promise = registerAction(transaction);
  var data = {
    some: "data"
  };
  resolveAction(transaction, data);
  expect.assertions(1);
  return promise.then(function (value) {
    return expect(value).toEqual(data);
  });
});
test('rejects first action with correct transaction', function () {
  var transaction = 0;
  var promise = registerAction(transaction);
  var data = {
    some: "data"
  };
  rejectAction(transaction, data);
  expect.assertions(1);
  return promise.catch(function (error) {
    return expect(error).toEqual(data);
  });
});
test('does not resolve first action with incorrect transaction', function () {
  var transaction = 0;
  var promise = registerAction(transaction);
  var incorrectData = {
    incorrect: "data"
  };
  resolveAction(transaction + 1, incorrectData);
  var correctData = {
    some: "data"
  };
  resolveAction(transaction, correctData);
  expect.assertions(1);
  return promise.then(function (value) {
    return expect(value).toEqual(correctData);
  });
});
test('resolves second action with correct transaction', function () {
  var array = [];
  registerAction(0).then(function () {
    return array.push(0);
  });
  var promise = registerAction(1).then(function () {
    return array.push(1);
  });
  resolveAction(1);
  resolveAction(0);
  expect.assertions(1);
  return promise.then(function () {
    return expect(array).toEqual([1, 0]);
  });
});
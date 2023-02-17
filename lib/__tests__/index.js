"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _redux = require("redux");

var _constants = require("redux-persist/lib/constants");

var _reduxPersistNodeStorage = require("redux-persist-node-storage");

var _reduxDevtoolsInstrument = _interopRequireDefault(require("redux-devtools-instrument"));

var _index = require("../index");

var _config = require("../config");

var _actions = require("../actions");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var storageKey = "".concat(_constants.KEY_PREFIX, "offline");

var defaultReducer = function defaultReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return state;
};

var noop = function noop() {};

var defaultConfig;
beforeEach(function () {
  var storage = new _reduxPersistNodeStorage.AsyncNodeStorage("/tmp/storageDir");
  defaultConfig = (0, _config.applyDefaults)({
    effect: jest.fn(function () {
      return Promise.resolve();
    }),
    persistOptions: {
      storage: storage
    }
  });
});
test("offline() creates storeEnhancer", function () {
  var storeEnhancer = (0, _index.offline)(defaultConfig);
  var store = storeEnhancer(_redux.createStore)(defaultReducer);
  expect(store.dispatch).toEqual(expect.any(Function));
  expect(store.getState).toEqual(expect.any(Function));
});
test("createOffline() creates storeEnhancer", function () {
  var _createOffline = (0, _index.createOffline)(defaultConfig),
      middleware = _createOffline.middleware,
      enhanceReducer = _createOffline.enhanceReducer,
      enhanceStore = _createOffline.enhanceStore;

  var reducer = enhanceReducer(defaultReducer);
  var store = (0, _redux.createStore)(reducer, (0, _redux.compose)((0, _redux.applyMiddleware)(middleware), enhanceStore));
  expect(store.dispatch).toEqual(expect.any(Function));
  expect(store.getState).toEqual(expect.any(Function));
}); // see https://github.com/redux-offline/redux-offline/issues/31

test("supports HMR by overriding `replaceReducer()`", function () {
  var store = (0, _index.offline)(defaultConfig)(_redux.createStore)(defaultReducer);
  store.replaceReducer((0, _redux.combineReducers)({
    data: defaultReducer
  }));
  store.dispatch({
    type: "SOME_ACTION"
  });
  expect(store.getState()).toHaveProperty("offline");
});
test("createOffline() supports HMR", function () {
  var _createOffline2 = (0, _index.createOffline)(defaultConfig),
      middleware = _createOffline2.middleware,
      enhanceReducer = _createOffline2.enhanceReducer,
      enhanceStore = _createOffline2.enhanceStore;

  var reducer = enhanceReducer(defaultReducer);
  var store = (0, _redux.createStore)(reducer, (0, _redux.compose)((0, _redux.applyMiddleware)(middleware), enhanceStore));
  store.replaceReducer((0, _redux.combineReducers)({
    data: defaultReducer
  }));
  store.dispatch({
    type: "SOME_ACTION"
  });
  expect(store.getState()).toHaveProperty("offline");
}); // see https://github.com/redux-offline/redux-offline/issues/4

test("restores offline outbox when rehydrates", function (done) {
  var actions = [{
    type: "SOME_OFFLINE_ACTION",
    meta: {
      offline: {
        effect: {}
      }
    }
  }];
  defaultConfig.persistOptions.storage.setItem(storageKey, JSON.stringify({
    outbox: actions
  }), noop);
  var store = (0, _index.offline)(_objectSpread(_objectSpread({}, defaultConfig), {}, {
    persistCallback: function persistCallback() {
      var _store$getState = store.getState(),
          outbox = _store$getState.offline.outbox;

      expect(outbox).toEqual(actions);
      done();
    }
  }))(_redux.createStore)(defaultReducer);
}); // see https://github.com/jevakallio/redux-offline/pull/91

test("works with devtools store enhancer", function () {
  var monitorReducer = function monitorReducer(state) {
    return state;
  };

  var store = (0, _redux.createStore)(defaultReducer, (0, _redux.compose)((0, _index.offline)(defaultConfig), (0, _reduxDevtoolsInstrument.default)(monitorReducer)));
  expect(function () {
    store.dispatch({
      type: "SOME_ACTION"
    });
  }).not.toThrow();
}); // there were some reports that this might not be working correctly

test("coming online processes outbox", function () {
  var _createOffline3 = (0, _index.createOffline)(defaultConfig),
      middleware = _createOffline3.middleware,
      enhanceReducer = _createOffline3.enhanceReducer;

  var reducer = enhanceReducer(defaultReducer);
  var store = (0, _redux.createStore)(reducer, (0, _redux.applyMiddleware)(middleware));
  expect(store.getState().offline.online).toBe(false);
  var action = {
    type: "REQUEST",
    meta: {
      offline: {
        effect: {}
      }
    }
  };
  store.dispatch(action);
  expect(defaultConfig.effect).not.toBeCalled();
  store.dispatch((0, _actions.networkStatusChanged)(true));
  expect(store.getState().offline.online).toBe(true);
  expect(defaultConfig.effect).toBeCalled();
});
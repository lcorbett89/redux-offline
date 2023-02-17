"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _send = _interopRequireDefault(require("../send"));

var _actions = require("../actions");

var _defaultCommit = _interopRequireDefault(require("../defaults/defaultCommit"));

var _defaultRollback = _interopRequireDefault(require("../defaults/defaultRollback"));

var _offlineActionTracker = _interopRequireDefault(require("../offlineActionTracker"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var DELAY = 1000;
var completedMeta = {
  meta: expect.objectContaining({
    completed: expect.any(Boolean)
  })
};

function setup(partialConfig) {
  var defaultConfig = {
    effect: jest.fn(function () {
      return Promise.resolve();
    }),
    discard: function discard() {
      return false;
    },
    retry: function retry() {
      return DELAY;
    },
    defaultCommit: _defaultCommit.default,
    defaultRollback: _defaultRollback.default,
    offlineActionTracker: _offlineActionTracker.default.withoutPromises
  };
  return {
    action: {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: {
            url: '/api/resource',
            method: 'get'
          },
          commit: {
            type: 'COMMIT'
          },
          rollback: {
            type: 'ROLLBACK'
          }
        },
        transaction: 0
      }
    },
    config: _objectSpread(_objectSpread({}, defaultConfig), partialConfig),
    dispatch: jest.fn()
  };
}

test('dispatches busy action', function () {
  var _setup = setup(),
      action = _setup.action,
      config = _setup.config,
      dispatch = _setup.dispatch;

  var promise = (0, _send.default)(action, dispatch, config);
  expect.assertions(2);
  return promise.then(function () {
    expect(dispatch).toBeCalledWith((0, _actions.busy)(true));
    expect(dispatch).toHaveBeenLastCalledWith((0, _actions.busy)(false));
  });
});
test('requests resource using effects reconciler', function () {
  var _setup2 = setup(),
      action = _setup2.action,
      config = _setup2.config,
      dispatch = _setup2.dispatch;

  (0, _send.default)(action, dispatch, config);
  expect(config.effect).toBeCalledWith(action.meta.offline.effect, action);
});
describe('when request succeeds', function () {
  test('dispatches complete action', function () {
    var effect = function effect() {
      return Promise.resolve();
    };

    var _setup3 = setup({
      effect: effect
    }),
        action = _setup3.action,
        config = _setup3.config,
        dispatch = _setup3.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    var commit = action.meta.offline.commit;
    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(commit));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});
describe('when request fails', function () {
  test('dispatches schedule retry action', function () {
    var effect = function effect() {
      return Promise.reject();
    };

    var _setup4 = setup({
      effect: effect
    }),
        action = _setup4.action,
        config = _setup4.config,
        dispatch = _setup4.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    expect.assertions(1);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith((0, _actions.scheduleRetry)(DELAY));
    });
  });
  test('dispatches complete action on discard', function () {
    var effect = function effect() {
      return Promise.reject();
    };

    var discard = function discard() {
      return true;
    };

    var _setup5 = setup({
      effect: effect,
      discard: discard
    }),
        action = _setup5.action,
        config = _setup5.config,
        dispatch = _setup5.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    var rollback = action.meta.offline.rollback;
    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
  test('dispatches complete action with promised discard', function () {
    var effect = function effect() {
      return Promise.reject();
    };

    var discard = function discard() {
      return Promise.resolve(true);
    };

    var _setup6 = setup({
      effect: effect,
      discard: discard
    }),
        action = _setup6.action,
        config = _setup6.config,
        dispatch = _setup6.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    var rollback = action.meta.offline.rollback;
    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
  test('dispatches complete action when discard throw an exception', function () {
    var effect = function effect() {
      return Promise.reject();
    };

    var discard = function discard() {
      throw new Error();
    };

    var _setup7 = setup({
      effect: effect,
      discard: discard
    }),
        action = _setup7.action,
        config = _setup7.config,
        dispatch = _setup7.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    var rollback = action.meta.offline.rollback;
    expect.assertions(2);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(rollback));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});
describe('when request succeeds and commit is undefined', function () {
  test('dispatches default commit action', function () {
    var effect = function effect() {
      return Promise.resolve();
    };

    var action = {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: {
            type: 'MOCK'
          }
        }
      }
    };

    var _setup8 = setup({
      effect: effect
    }),
        config = _setup8.config,
        dispatch = _setup8.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(_defaultCommit.default));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});
describe('when request is to be discarded and rollback is undefined', function () {
  test('dispatches default rollback action', function () {
    var effect = function effect() {
      return Promise.reject();
    };

    var discard = function discard() {
      return true;
    };

    var action = {
      type: 'REQUEST',
      meta: {
        offline: {
          effect: {
            type: 'MOCK'
          }
        }
      }
    };

    var _setup9 = setup({
      effect: effect,
      discard: discard
    }),
        config = _setup9.config,
        dispatch = _setup9.dispatch;

    var promise = (0, _send.default)(action, dispatch, config);
    return promise.then(function () {
      expect(dispatch).toBeCalledWith(expect.objectContaining(_defaultRollback.default));
      expect(dispatch).toBeCalledWith(expect.objectContaining(completedMeta));
    });
  });
});
describe('offlineActionTracker', function () {
  var trackerMock;
  beforeEach(function () {
    trackerMock = {
      registerAction: function registerAction() {},
      resolveAction: jest.fn(),
      rejectAction: jest.fn()
    };
  });
  test('resolves action on successful complete', function () {
    var effect = function effect() {
      return Promise.resolve();
    };

    var _setup10 = setup({
      effect: effect
    }),
        action = _setup10.action,
        config = _setup10.config,
        dispatch = _setup10.dispatch;

    var promise = (0, _send.default)(action, dispatch, _objectSpread(_objectSpread({}, config), {}, {
      offlineActionTracker: trackerMock
    }));
    expect.assertions(1);
    return promise.then(function () {
      return expect(trackerMock.resolveAction).toBeCalled();
    });
  });
  test('rejects action on failed complete', function () {
    var effect = function effect() {
      return Promise.reject(new Error());
    };

    var discard = function discard() {
      return true;
    };

    var _setup11 = setup({
      effect: effect,
      discard: discard
    }),
        action = _setup11.action,
        config = _setup11.config,
        dispatch = _setup11.dispatch;

    var promise = (0, _send.default)(action, dispatch, _objectSpread(_objectSpread({}, config), {}, {
      offlineActionTracker: trackerMock
    }));
    expect.assertions(1);
    return promise.then(function () {
      return expect(trackerMock.rejectAction).toBeCalled();
    });
  });
});
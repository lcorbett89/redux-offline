"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _middleware = require("../middleware");

var _actions = require("../actions");

var _defaults = _interopRequireDefault(require("../defaults"));

var _constants = require("../constants");

var _send = _interopRequireDefault(require("../send"));

var _offlineActionTracker = _interopRequireDefault(require("../offlineActionTracker"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var offlineAction = {
  type: 'OFFLINE_ACTION_REQUEST',
  meta: {
    offline: {
      effect: {
        url: '/api/endpoint',
        method: 'POST'
      },
      commit: {
        type: 'OFFLINE_ACTION_COMMIT'
      },
      rollback: {
        type: 'OFFLINE_ACTION_ROLLBACK'
      }
    },
    transaction: 0
  }
};
var defaultOfflineState = {
  busy: false,
  lastTransaction: 0,
  online: true,
  outbox: [offlineAction],
  receipts: [],
  retryToken: 0,
  retryCount: 0,
  retryScheduled: false,
  netInfo: {
    isConnectionExpensive: null,
    reach: 'NONE'
  }
};

function setup() {
  var offlineState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var state = {
    offline: _objectSpread(_objectSpread({}, defaultOfflineState), offlineState)
  };
  return {
    config: _objectSpread(_objectSpread({}, _defaults.default), {}, {
      rehydrate: false,
      persist: null,
      detectNetwork: null,
      batch: jest.fn(function (outbox) {
        return outbox.slice(0, 1);
      }),
      effect: jest.fn(),
      retry: jest.fn(),
      discard: jest.fn(),
      offlineActionTracker: _offlineActionTracker.default.withoutPromises
    }),
    store: {
      getState: jest.fn(function () {
        return state;
      }),
      dispatch: jest.fn()
    },
    next: jest.fn(function (action) {
      return {
        actions: [action]
      };
    }),
    action: {
      type: 'NOT_OFFLINE_ACTION'
    }
  };
} // NOTE: there is not currently an action creator for this


function offlineSend() {
  return {
    type: _constants.OFFLINE_SEND
  };
}

jest.mock('../send', function () {
  return jest.fn(function () {
    return Promise.resolve();
  });
});
beforeEach(_send.default.mockClear);
test('creates middleware', function () {
  var _setup = setup(),
      config = _setup.config,
      store = _setup.store,
      next = _setup.next,
      action = _setup.action;

  var middleware = (0, _middleware.createOfflineMiddleware)(config);
  var result = middleware(store)(next)(action);
  expect(next).toBeCalled();
  expect(result).toEqual(next(action));
});
describe('on any action', function () {
  it('processes outbox when idle', function () {
    var _setup2 = setup(),
        config = _setup2.config,
        store = _setup2.store,
        next = _setup2.next,
        action = _setup2.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send.default).toBeCalled();
  });
  it('does not process outbox when busy', function () {
    var _setup3 = setup({
      busy: true
    }),
        config = _setup3.config,
        store = _setup3.store,
        next = _setup3.next,
        action = _setup3.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send.default).not.toBeCalled();
  });
  it('does not process outbox when retry scheduled', function () {
    var _setup4 = setup({
      retryScheduled: true
    }),
        config = _setup4.config,
        store = _setup4.store,
        next = _setup4.next,
        action = _setup4.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send.default).not.toBeCalled();
  });
  it('does not process outbox when offline', function () {
    var _setup5 = setup({
      online: false
    }),
        config = _setup5.config,
        store = _setup5.store,
        next = _setup5.next,
        action = _setup5.action;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(action);
    expect(_send.default).not.toBeCalled();
  });
}); // TODO: test for double dispatch

describe('on OFFLINE_SEND', function () {
  it('processes outbox when idle', function () {
    var _setup6 = setup(),
        config = _setup6.config,
        store = _setup6.store,
        next = _setup6.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send.default).toBeCalled();
  });
  it('does not process outbox when busy', function () {
    var _setup7 = setup({
      busy: true
    }),
        config = _setup7.config,
        store = _setup7.store,
        next = _setup7.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send.default).not.toBeCalled();
  });
  it('processes outbox when retry scheduled', function () {
    var _setup8 = setup({
      retryScheduled: true
    }),
        config = _setup8.config,
        store = _setup8.store,
        next = _setup8.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send.default).toBeCalled();
  });
  it('processes outbox when offline', function () {
    var _setup9 = setup({
      online: false
    }),
        config = _setup9.config,
        store = _setup9.store,
        next = _setup9.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineSend());
    expect(_send.default).toBeCalled();
  });
}); // TODO: wrapping `setTimeout()` in a promise in `after()` is pointless

describe('on OFFLINE_SCHEDULE_RETRY', function () {
  jest.useFakeTimers();
  var delay = 15000;
  test('dispatches COMPLETE_RETRY after delay', function () {
    var _setup10 = setup(),
        config = _setup10.config,
        store = _setup10.store,
        next = _setup10.next;

    (0, _middleware.createOfflineMiddleware)(config)(store)(next)((0, _actions.scheduleRetry)(delay));
    jest.runTimersToTime(delay);
    expect.assertions(1);
    var nextAction = store.getState().offline.outbox[0];
    return Promise.resolve().then(function () {
      return expect(store.dispatch).toBeCalledWith((0, _actions.completeRetry)(nextAction));
    });
  });
});
test('offlineActionTracker without promises', function () {
  var _setup11 = setup(),
      config = _setup11.config,
      store = _setup11.store,
      next = _setup11.next;

  var value = (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineAction);
  expect(value).not.toHaveProperty('then');
});
describe('offlineActionTracker integration', function () {
  var config, store, next;
  beforeEach(function () {
    var _setup12 = setup();

    config = _setup12.config;
    store = _setup12.store;
    next = _setup12.next;
    config = _objectSpread(_objectSpread({}, config), {}, {
      offlineActionTracker: _offlineActionTracker.default.withPromises
    });
  });
  test('returns a promise that can be resolved', function () {
    var promise = (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineAction);
    var transaction = 0;
    var data = {
      some: "data"
    };
    config.offlineActionTracker.resolveAction(transaction, data);
    expect.assertions(1);
    return promise.then(function (value) {
      return expect(value).toEqual(data);
    });
  });
  test('returns a promise that can be rejected', function () {
    var promise = (0, _middleware.createOfflineMiddleware)(config)(store)(next)(offlineAction);
    var transaction = 0;
    var data = {
      some: 'data'
    };
    config.offlineActionTracker.rejectAction(transaction, data);
    expect.assertions(1);
    return promise.catch(function (error) {
      return expect(error).toEqual(data);
    });
  });
});
// Creates a mock kapsule factory that mimics the interface expected by react-kapsule.
// Uses plain functions (not jest.fn()) to avoid cross-realm instanceof issues —
// react-kapsule checks `comp[method] instanceof Function` before calling prop setters,
// and jest.fn() from a different VM context fails that check.

function createTrackedFn(returnValue) {
  const calls = [];
  function tracked(...args) {
    calls.push(args);
    return returnValue;
  }
  tracked._calls = calls;
  tracked._isMock = true;
  tracked.mockClear = () => { calls.length = 0; };
  return tracked;
}

export function mockCreateKapsule() {
  const instances = [];

  function factory(configOptions) {
    // The instance must be callable (for comp(domEl) mounting)
    const mountCalls = [];
    const instance = function (...args) { mountCalls.push(args); };
    instance._mountCalls = mountCalls;
    instance._destructor = function () {};

    // Every prop name becomes a tracked setter
    const handler = {
      get(target, prop) {
        if (prop in target) return target[prop];
        // Auto-create a tracked function for any accessed property
        if (typeof prop === 'string' && prop !== 'then') {
          target[prop] = createTrackedFn(new Proxy(target, handler));
          return target[prop];
        }
        return undefined;
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    };

    const proxiedInstance = new Proxy(instance, handler);
    proxiedInstance._configOptions = configOptions;
    instances.push(proxiedInstance);
    return proxiedInstance;
  }

  factory._instances = instances;
  factory._lastInstance = () => instances[instances.length - 1];
  return factory;
}

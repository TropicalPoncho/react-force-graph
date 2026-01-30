// Custom matchers for our tracked mock functions.
// These provide a clean assertion API similar to jest.fn() matchers.

expect.extend({
  toHaveBeenCalledWithArgs(received, ...expected) {
    if (!received || !received._isMock) {
      return {
        pass: false,
        message: () => `expected a tracked mock function, got ${typeof received}`
      };
    }
    const calls = received._calls;
    const match = calls.some(
      callArgs => callArgs.length === expected.length &&
        callArgs.every((arg, i) => Object.is(arg, expected[i]))
    );
    return {
      pass: match,
      message: () => match
        ? `expected mock not to have been called with ${JSON.stringify(expected)}`
        : `expected mock to have been called with ${JSON.stringify(expected)}, but calls were: ${JSON.stringify(calls)}`
    };
  },

  toHaveBeenMockCalled(received) {
    if (!received || !received._isMock) {
      return {
        pass: false,
        message: () => `expected a tracked mock function, got ${typeof received}`
      };
    }
    return {
      pass: received._calls.length > 0,
      message: () => received._calls.length > 0
        ? `expected mock not to have been called, but it was called ${received._calls.length} times`
        : `expected mock to have been called, but it was not called`
    };
  }
});

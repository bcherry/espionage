var jstest = (function() {
  var hasBeenSetup = false,
      windowProps = {},
      spiedFunctions = [];

  function spy(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return generateSpy(namespace);
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = generateSpy(namespace[property]);
  }

  function generateSpy(fn) {
    function spied() {
      var args = Array.prototype.slice.apply(arguments),
          returned = fn.apply(this, args);

      spied.calls.push({
        arguments: args,
        returned: returned
      });

      return returned;
    }

    spied.calls = [];

    spiedFunctions.push({
      spied: spied,
      original: fn
    });

    return spied;
  }

  function unspy(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findSpied(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findSpied(namespace[property]).original;
  }

  function mock() {
  }

  function setup() {
    if (hasBeenSetup) {
      return false;
    }

    hasBeenSetup = true;

    replaceGlobal("mock", mock);
    replaceGlobal("spy", spy);
    replaceGlobal("unspy", unspy);

    return true;
  }

  function teardown() {
    if (!hasBeenSetup) {
      return false;
    }

    hasBeenSetup = false;

    putGlobalBack("mock");
    putGlobalBack("spy");
    putGlobalBack("unspy");

    return true;
  }

  function use() {
  }

  function replaceGlobal(property, value) {
    if (window.hasOwnProperty(property)) {
      windowProps[property] = window[property];
    }

    window[property] = value;
  }

  function putGlobalBack(property) {
    if (windowProps.hasOwnProperty(property)) {
      window[property] = windowProps[property];
      delete windowProps[property];
    } else {
      delete window[property];
    }
  }

  function findSpied(spied) {
    for (var i = 0; i < spiedFunctions.length; i++) {
      if (spiedFunctions[i].spied === spied) {
        return spiedFunctions[i];
      }
    }
  }

  function resolveNamespace(namespace, property) {
    if (typeof namespace === "string") {
      property = namespace;
      namespace = window;
    }

    var steps = property.split(".");
    property = steps.pop();
    for (var i = 0; i < steps.length; i++) {
      namespace = namespace[steps[i]];
    }


    return {
      namespace: namespace,
      property: property
    };
  }


  return {
    spy: spy,
    unspy: unspy,
    mock: mock,
    setup: setup,
    teardown: teardown,
    use: use
  };
}());

/*
  spy - count calls to a function
    - number of calls
    - arguments for each call
    - return value for each call

  mock - re-implement a function
    - replace entire function body
      - access to fall-back to original
    - just specify a return value
    - limit to particular arguments
    - require call count

  time control - allow manual passage of time in linear fashion
    - mock setTimeout, setInterval
    - wait() to step into the future
    - flush() to clear all timers

  test control - insert and remove jstest interface from global namespace
    - use() to wrap a callback with automatic setup and teardown
    - setup() and teardown() to do it manually, or integrate with test framework

*/
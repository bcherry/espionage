var jstest = (function() {
  var hasBeenSetup = false,
      windowProps = {},
      spiedFunctions = [],
      stubbedFunctions = [];

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

  function stub(namespace, property, value) {
    if (typeof namespace === "function" && typeof property == "function") {
      return generateStub(namespace, property);
    }

    if (typeof property === "function" && typeof value === "undefined") {
      value = property;
      property = undefined;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = generateStub(namespace[property], value);
  }

  function unstub(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findStubbed(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findStubbed(namespace[property]).original;
  }

  function generateStub(original, stubbed) {
    stubbedFunctions.push({
      original: original,
      stubbed: stubbed
    });

    return stubbed;
  }

  function mock() {
  }

  function unmock() {
  }

  function setup() {
    if (hasBeenSetup) {
      return false;
    }

    hasBeenSetup = true;

    replaceGlobal("spy", spy);
    replaceGlobal("unspy", unspy);
    replaceGlobal("stub", stub);
    replaceGlobal("unstub", stub);
    replaceGlobal("mock", mock);
    replaceGlobal("unmock", unmock);

    return true;
  }

  function teardown() {
    if (!hasBeenSetup) {
      return false;
    }

    hasBeenSetup = false;

    putGlobalBack("spy");
    putGlobalBack("unspy");
    putGlobalBack("stub");
    putGlobalBack("unstub");
    putGlobalBack("mock");
    putGlobalBack("unmock");

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

  function findStubbed(stubbed) {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      if (stubbedFunctions[i].stubbed === stubbed) {
        return stubbedFunctions[i];
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
    stub: stub,
    unstub: unstub,
    mock: mock,
    unmock: unmock,
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

  stub - re-implement a function
    - replace entire function body
      - access to fall-back to original

  mock - full control over function (stub and spy)
    - just specify a return value
    - limit to particular arguments
    - require call count

  time control - allow manual passage of time in linear fashion
    - stub setTimeout, setInterval
    - wait() to step into the future
    - flush() to clear all timers

  test control - insert and remove jstest interface from global namespace
    - use() to wrap a callback with automatic setup and teardown
    - setup() and teardown() to do it manually, or integrate with test framework

*/
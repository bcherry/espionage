// Make these simply basic global vars, so IE doesn't throw when trying to reassign
// try {
//   setTimeout = setTimeout;
// } catch (e) {
//   var setTimeout = (window.__proto__ || window.constructor.prototype).setTimeout,
//       setInterval = (window.__proto__ || window.constructor.prototype).setInterval,
//       clearTimeout = (window.__proto__ || window.constructor.prototype).clearTimeout,
//       clearInterval = (window.__proto__ || window.constructor.prototype).clearInterval;
// }

var jstest = (function() {
  var hasBeenSetup = false,
      windowProps = {},
      spiedFunctions = [],
      stubbedFunctions = [];

  var globalInterface = {
    spy: function(namespace, property) {
      if (typeof namespace === "function" && typeof property == "undefined") {
        return generateSpy(namespace);
      }

      var resolved = resolveNamespace(namespace, property);
      namespace = resolved.namespace;
      property = resolved.property;

      namespace[property] = generateSpy(namespace[property]);
    },

    unspy: function(namespace, property) {
      if (typeof namespace === "function" && typeof property == "undefined") {
        return findSpied(namespace).original;
      }

      var resolved = resolveNamespace(namespace, property);
      namespace = resolved.namespace;
      property = resolved.property;

      namespace[property] = findSpied(namespace[property]).original;
    },

    stub: function(namespace, property, value) {
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
    },

    unstub: function(namespace, property) {
      if (typeof namespace === "function" && typeof property == "undefined") {
        return findStubbed(namespace).original;
      }

      var resolved = resolveNamespace(namespace, property);
      namespace = resolved.namespace;
      property = resolved.property;

      namespace[property] = findStubbed(namespace[property]).original;
    },

    mock: function() {
    },

    unmock: function() {
    }
  };

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

  function generateStub(original, stubbed) {
    stubbedFunctions.push({
      original: original,
      stubbed: stubbed
    });

    return stubbed;
  }

  function replaceGlobal(property, value) {
    if (property in window) {
      windowProps[property] = window[property];
    }

    window[property] = value;
  }

  function putGlobalBack(property) {
    if (windowProps.hasOwnProperty(property)) {
      window[property] = windowProps[property];
      delete windowProps[property];
    } else {
      try {
        delete window[property];
      } catch (e) {
        var undefined;
        window[property] = undefined;
      }
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


  function each(obj, fn) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        fn(prop, obj[prop]);
      }
    }
  }

  var publicInterface = {
    setup: function() {
      if (hasBeenSetup) {
        return false;
      }

      hasBeenSetup = true;

      each(globalInterface, function(prop, val) {
        replaceGlobal(prop, val);
      });

      replaceGlobal("setTimeout", function() {
        return "stubbed";
      });

      replaceGlobal("clearTimeout", function() {
        return "stubbed";
      });

      replaceGlobal("setInterval", function() {
        return "stubbed";
      });

      replaceGlobal("clearInterval", function() {
        return "stubbed";
      });


      return true;
    },

    teardown: function() {
      if (!hasBeenSetup) {
        return false;
      }

      hasBeenSetup = false;

      each(globalInterface, function(prop, val) {
        putGlobalBack(prop);
      });

      putGlobalBack("setTimeout");
      putGlobalBack("clearTimeout");
      putGlobalBack("setInterval");
      putGlobalBack("clearInterval");

      return true;
    },

    use: function() {
    },

    __originalSetTimeout: window.setTimeout,
    __originalSetInterval: window.setInterval,
    __originalClearTimeout: window.clearTimeout,
    __originalClearInterval: window.clearInterval
  };

  each(globalInterface, function(prop, val) {
    publicInterface[prop] = val;
  });

  return publicInterface;
}());

eval("var setTimeout, setInterval, clearTimeout, clearInterval;");
setTimeout = jstest.__originalSetTimeout;
setInterval = jstest.__originalSetInterval;
clearTimeout = jstest.__originalClearTimeout;
clearInterval = jstest.__originalClearInterval;

delete jstest.__originalSetTimeout;
delete jstest.__originalSetInterval;
delete jstest.__originalClearTimeout;
delete jstest.__originalClearInterval;

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
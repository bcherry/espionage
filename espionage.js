// So we can safely override these later
// See: http://www.adequatelygood.com/2011/4/Replacing-setTimeout-Globally
window.setTimeout = window.setTimeout;
window.clearTimeout = window.clearTimeout;
window.setInterval = window.setInterval;
window.clearInterval = window.clearInterval;

var espionage = (function() {
  var hasBeenSetup = false,
      windowProps = {},
      spiedFunctions = [],
      stubbedFunctions = [],
      mockedFunctions = [],
      timers = [],
      globalTime = 0;

  var globalInterface = {
    spy: function(namespace, property) {
      if (typeof property == "undefined") {
        if (typeof namespace === "function") {
          return generateSpy(namespace);
        } else if (typeof namespace === "undefined") {
          return generateSpy();
        }
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

    mock: function(namespace, property) {
      var resolved = resolveNamespace(namespace, property);

      namespace = resolved.namespace;
      property = resolved.property;

      var mocker = generateMocker(namespace[property]);
      namespace[property] = mocker._proxy;

      return mocker;
    },

    unmock: function() {
    },

    wait: function(time) {
      globalTime += time;

      for (var i = 0; i < timers.length; i++) {
        var timer = timers[i];
        if (timer) {
          if (timer.next <= globalTime) {
            if (timer.repeat) {
              do {
                timer.fn.call();
                timer.next += timer.time;
              } while (timer.next <= globalTime);
            } else {
              timer.fn.call();
              delete timer[i];
            }
          }
        }
      }
    },

    setTimeout: function(fn, time) {
      return generateTimer(fn, time, false);
    },

    clearTimeout: function(id) {
      return clearTimer(id);
    },

    setInterval: function(fn, time) {
      return generateTimer(fn, time, true);
    },

    clearInterval: function(id) {
      return clearTimer(id);
    }
  };

  function generateSpy(fn) {
    fn = fn || function(){};

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

  function generateMocker(original) {
    var mocker = findMockerByProxy(original);
    if (mocker) {
      return mocker;
    }

    mocker = new Mocker(original);

    mockedFunctions.push({
      original: original,
      mocker: mocker
    });

    return mocker;
  }

  function generateTimer(fn, time, repeat) {
    if (typeof fn === "string") {
      fn = new Function(fn);
    }
    timers.push({
      fn: fn,
      time: time,
      next: globalTime + time,
      repeat: repeat
    });

    return timers.length - 1;
  }

  function clearTimer(id) {
    delete timers[id];
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

  function findMockerByProxy(proxy) {
    for (var i = 0; i < mockedFunctions.length; i++) {
      if (mockedFunctions[i].mocker.proxy === proxy) {
        return mockedFunctions[i];
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

  function Mocker(original) {
    var that = this;

    this._proxy = function() {
      var matched = false;
      if (that._expectedArgs.length === arguments.length) {
        matched = true;
        for (var i = 0; i < arguments.length; i++) {
          if (arguments[i] !== that._expectedArgs[i]) {
            matched = false;
          }
        }
      }

      if (matched) {
        return that._returnVal;
      }

      throw new espionage.UnexpectedInvocationError();
    };
  }

  Mocker.prototype = {
    withArgs: function() {
      this._expectedArgs = arguments;

      return this;
    },

    returns: function(returnVal) {
      this._returnVal = returnVal;

      return this;
    }
  };

  function createObject(proto) {
    function F(){}
    F.prototype = proto;
    return new F();
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

      return true;
    },

    use: function(fn) {
      espionage.setup();
      fn();
      espionage.teardown();
    },

    UnexpectedInvocationError: function(){}
  };

  each(globalInterface, function(prop, val) {
    publicInterface[prop] = val;
  });

  return publicInterface;
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

  test control - insert and remove espionage interface from global namespace
    - use() to wrap a callback with automatic setup and teardown
    - setup() and teardown() to do it manually, or integrate with test framework

*/
/*!
 * espionage.js
 *
 * Copyright (C) 2011 by Ben Cherry <bcherry@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var espionage = (function() {
  var setupModules = false,
      windowProps = {},
      extensions = {};

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

  function each(obj, fn) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        fn(prop, obj[prop]);
      }
    }
  }

  function eachWithExceptions(obj, fn) {
    var caught;

    each(obj, function(prop, val) {
      try {
        fn.call(this, prop, val);
      } catch (e) {
        if (!caught) {
          caught = e;
        }
      }
    });

    if (caught) {
      throw caught;
    }
  }

  function allWithExceptions(functions) {
    var caught;
    for (var i = 0; i < functions.length; i++) {
      try {
        functions[i].call();
      } catch (e) {
        if (!caught) {
          caught = e;
        }
      }
    }

    if (caught) {
      throw caught;
    }
  }

  var publicInterface = {
    setup: function(modules) {
      if (setupModules) {
        return false;
      }

      modules = modules || {};

      setupModules = modules;

      eachWithExceptions(extensions, function(name, extension) {
        if (modules[name] === false) {
          console.log("skipping setup for ", name);
          return;
        }

        each(extension.globals, function(prop, val) {
          replaceGlobal(prop, val);
        });

        allWithExceptions(extension.setups);
      });

      return true;
    },

    teardown: function() {
      if (!setupModules) {
        return false;
      }

      var modules = setupModules;
      setupModules = false;

      eachWithExceptions(extensions, function(name, extension) {
        if (modules[name] === false) {
          console.log("skipping teardown for ", name);
          return;
        }

        each(extension.globals, function(prop, val) {
          putGlobalBack(prop, val);
        });

        allWithExceptions(extension.teardowns);
      });

      return true;
    },

    use: function(modules, fn) {
      if (typeof fn === "undefined" && typeof modules === "function") {
        fn = modules;
        modules = undefined;
      }
      espionage.setup(modules);
      fn();
      espionage.teardown();
    },

    UnexpectedInvocationError: function(){},
    TooFewInvocationsError: function(){},

    extend: function(name, callback) {
      if (extensions[name]) {
        return extensions[name];
      }

      var extender = new Extender();
      extensions[name] = extender;

      callback(extender);
    },

    unextend: function(name) {
      delete extensions[name];
    },

    _util: {
      resolveNamespace: function(namespace, property) {
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
      },

      each: each
    }
  };

  function Extender() {
    this.globals = {};
    this.setups = [];
    this.teardowns = [];
  }

  Extender.prototype = {
    extendGlobals: function(name, property) {
      this.globals[name] = property;
    },

    extendSetup: function(fn) {
      this.setups.push(fn);
    },

    extendTeardown: function(fn) {
      this.teardowns.push(fn);
    }
  };

  return publicInterface;
}());
espionage.extend("mock", function(e) {
  var mockedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("mock", function(namespace, property) {
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mocker = generateMocker(namespace, property);
    namespace[property] = mocker._proxy;

    return mocker;
  });

  e.extendGlobals("unmock", function(namespace, property) {
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mock = findMockByProxy(namespace[property], true);

    if (mock) {
      teardownMock(mock);
    }
  });

  e.extendTeardown(function() {
    var caught;
    for (var i = 0; i < mockedFunctions.length; i++) {
      try {
        teardownMock(mockedFunctions[i]);
      } catch (e) {
        if (!caught) {
          caught = e;
        }
      }
    }

    mockedFunctions = [];

    if (caught) {
      throw caught;
    }
  });

  function generateMocker(namespace, property) {
    var original = namespace[property],
        mock = findMockByProxy(original);

    if (mock) {
      return mock.mocker;
    }

    var mocker = new Mocker(original);

    mockedFunctions.push({
      original: original,
      mocker: mocker,
      namespace: namespace,
      property: property
    });

    return mocker;
  }

  function teardownMock(mock) {
    var expectations = mock.mocker._expectations;

    for (var i = 0; i < expectations.length; i++) {
      var expectation = expectations[i];
      if (expectation.atLeast && expectation.invocations < expectation.atLeast) {
        throw new espionage.TooFewInvocationsError();
      }
    }

    mock.namespace[mock.property] = mock.original;
  }


  function Mocker(original) {
    var that = this;

    this._proxy = function() {
      var matched = false;

      for (var i = 0; i < that._expectations.length; i++) {
        var expectation = that._expectations[i];

        if (!expectation.args) {
          matched = true;
        } else if (expectation.args.length === arguments.length) {
          matched = true;
          for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== expectation.args[i]) {
              matched = false;
            }
          }
        }

        if (matched) {
          expectation.invocations++;

          if (typeof expectation.atMost === "number" && expectation.invocations > expectation.atMost) {
            throw new espionage.UnexpectedInvocationError();
          }

          return expectation.val;
        }
      }

      throw new espionage.UnexpectedInvocationError();
    };

    this._original = original;

    this._expectations = [];
  }

  function makeAnExpecterAndCall(functionName) {
    return function() {
      var expecter = new Expecter();

      this._expectations.push(expecter.expectation);

      expecter[functionName].apply(expecter, arguments);

      return expecter;
    };
  }

  Mocker.prototype = {
    withArgs: makeAnExpecterAndCall("withArgs"),
    returns: makeAnExpecterAndCall("returns"),
    atMost: makeAnExpecterAndCall("atMost"),
    atLeast: makeAnExpecterAndCall("atLeast"),
    exactly: makeAnExpecterAndCall("exactly")
  };

  function Expecter(mocker) {
    this.expectation = {
      invocations: 0
    };
  }

  Expecter.prototype = {
    withArgs: function() {
      this.expectation.args = Array.prototype.slice.apply(arguments);

      return this;
    },

    returns: function(returnVal) {
      this.expectation.val = returnVal;

      return this;
    },

    atMost: function(times) {
      this.expectation.atMost = times;

      return this;
    },

    atLeast: function(times) {
      this.expectation.atLeast = times;

      return this;
    },

    exactly: function(times) {
      this.atMost(times).atLeast(times);

      return this;
    }
  };

  function findMockByProxy(proxy, remove) {
    for (var i = 0; i < mockedFunctions.length; i++) {
      if (mockedFunctions[i].mocker._proxy === proxy) {
        var mock = mockedFunctions[i]
        if (remove) {
          mockedFunctions.splice(i, 1);
        }
        return mock;
      }
    }
  }

});
espionage.extend("spy", function(e) {
  var spiedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("spy", function(namespace, property) {
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

    namespace[property] = generateSpy(namespace[property], namespace, property);
  });

  e.extendGlobals("unspy", function(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findSpied(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findSpied(namespace[property]).original;
  });

  e.extendGlobals("debrief", function(spy) {
    var spy = findSpied(spy);

    if (spy) {
      return spy.data;
    }

    return false;
  });

  e.extendTeardown(function() {
    for (var i = 0; i < spiedFunctions.length; i++) {
      var spied = spiedFunctions[i];
      if (spied.namespace) {
        spied.namespace[spied.property] = spied.original;
      }
    }

    spiedFunctions = [];
  });

  function generateSpy(fn, namespace, property) {
    fn = fn || function(){};

    function spied() {
      var args = Array.prototype.slice.apply(arguments),
          returned = fn.apply(this, args);

      data.calls.push({
        arguments: args,
        returned: returned
      });

      return returned;
    }

    var data = {};

    data.calls = [];

    spiedFunctions.push({
      spied: spied,
      original: fn,
      namespace: namespace,
      property: property,
      data: data
    });

    return spied;
  }

  function findSpied(spied) {
    for (var i = 0; i < spiedFunctions.length; i++) {
      if (spiedFunctions[i].spied === spied) {
        return spiedFunctions[i];
      }
    }
  }

});
espionage.extend("stub", function(e) {
  var stubbedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("stub", function(namespace, property, value) {
    if (typeof namespace === "string") {
      value = property;
      property = namespace;
      namespace = window;
    }
    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    stubbedFunctions.push({
      original: namespace[property],
      stubbed: value,
      namespace: namespace,
      property: property
    });

    namespace[property] = value;
  });

  e.extendGlobals("unstub", function(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findStubbed(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findStubbed(namespace[property]).original;
  });

  e.extendTeardown(function() {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      var stubbed = stubbedFunctions[i];

      stubbed.namespace[stubbed.property] = stubbed.original;
    }
  });


  function findStubbed(stubbed) {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      if (stubbedFunctions[i].stubbed === stubbed) {
        return stubbedFunctions[i];
      }
    }
  }

});
// So we can safely override these later
// See: http://www.adequatelygood.com/2011/4/Replacing-setTimeout-Globally
window.setTimeout = window.setTimeout;
window.clearTimeout = window.clearTimeout;
window.setInterval = window.setInterval;
window.clearInterval = window.clearInterval;

espionage.extend("time", function(e) {
  var timers = [],
      globalTime = 0,
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("wait", function(time) {
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
            delete timers[i];
          }
        }
      }
    }
  });

  e.extendGlobals("setTimeout", function(fn, time) {
    return generateTimer(fn, time, false);
  });

  e.extendGlobals("clearTimeout", function(id) {
    return clearTimer(id);
  });

  e.extendGlobals("setInterval", function(fn, time) {
    return generateTimer(fn, time, true);
  });

  e.extendGlobals("clearInterval", function(id) {
    return clearTimer(id);
  });

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

});

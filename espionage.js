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

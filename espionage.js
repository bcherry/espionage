var espionage = (function() {
  var hasBeenSetup = false,
      windowProps = {},
      globalInterface = {};

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


  var publicInterface = {
    setup: function() {
      if (hasBeenSetup) {
        return false;
      }

      hasBeenSetup = true;

      espionage._util.each(globalInterface, function(prop, val) {
        replaceGlobal(prop, val);
      });

      return true;
    },

    teardown: function() {
      if (!hasBeenSetup) {
        return false;
      }

      hasBeenSetup = false;

      espionage._util.each(globalInterface, function(prop, val) {
        putGlobalBack(prop);
      });

      return true;
    },

    use: function(fn) {
      espionage.setup();
      fn();
      espionage.teardown();
    },

    UnexpectedInvocationError: function(){},

    extend: function(property, value) {
      globalInterface[property] = value;
      publicInterface[property] = value;
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

      each: function(obj, fn) {
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            fn(prop, obj[prop]);
          }
        }
      }
    }
  };

  return publicInterface;
}());

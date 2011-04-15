(function(espionage) {
  var mockedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  espionage.extend("mock", function(namespace, property) {
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mocker = generateMocker(namespace[property]);
    namespace[property] = mocker._proxy;

    return mocker;
  });

  espionage.extend("unmock", function() {
  });

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

  function findMockerByProxy(proxy) {
    for (var i = 0; i < mockedFunctions.length; i++) {
      if (mockedFunctions[i].mocker.proxy === proxy) {
        return mockedFunctions[i];
      }
    }
  }

}(espionage));

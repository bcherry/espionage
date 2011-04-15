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
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mocker = findMockerByProxy(namespace[property]);

    if (mocker) {
      if (mocker.atLeast && mocker.invocations < mocker.atLeast) {
        throw new espionage.TooFewInvocationsError();
      }

      namespace[property] = mocker._original;
    }
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

      for (var i = 0; i < that._expectations.length; i++) {
        var expectation = that._expectations[i];
        if (expectation.args.length === arguments.length) {
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
    atLeast: makeAnExpecterAndCall("atLeast")
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
    },

    atLeast: function(times) {
      this.expectation.atLeast = times;
    }
  };

  function findMockerByProxy(proxy) {
    for (var i = 0; i < mockedFunctions.length; i++) {
      if (mockedFunctions[i].mocker._proxy === proxy) {
        return mockedFunctions[i].mocker;
      }
    }
  }

}(espionage));

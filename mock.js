(function(espionage) {
  var mockedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  espionage.extend("mock", function(namespace, property) {
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mocker = generateMocker(namespace, property);
    namespace[property] = mocker._proxy;

    return mocker;
  });

  espionage.extend("unmock", function(namespace, property) {
    var resolved = resolveNamespace(namespace, property);

    namespace = resolved.namespace;
    property = resolved.property;

    var mock = findMockByProxy(namespace[property], true);

    if (mock) {
      teardownMock(mock);
    }
  });

  espionage.extendTeardown(function() {
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

}(espionage));

module("setup and teardown");

test("with no conflicts", function() {
  equal(typeof spy, "undefined", "'spy' is not available globally before setup");
  equal(typeof unspy, "undefined", "'unspy' is not available globally before setup");
  equal(typeof stub, "undefined", "'stub' is not available globally before setup");
  equal(typeof unstub, "undefined", "'unstub' is not available globally before setup");
  equal(typeof mock, "undefined", "'mock' is not available globally before setup");
  equal(typeof unmock, "undefined", "'unmock' is not available globally before setup");

  jstest.setup();

  equal(typeof spy, "function", "'spy' is available globally after setup");
  equal(typeof unspy, "function", "'unuspy' is available globally after setup");
  equal(typeof stub, "function", "'stub' is available globally after setup");
  equal(typeof unstub, "function", "'unstub' is available globally after setup");
  equal(typeof mock, "function", "'mock' is available globally after setup");
  equal(typeof unmock, "function", "'unmock' is available globally after setup");

  jstest.teardown();

  equal(typeof spy, "undefined", "'spy' is not available globally after teardown");
  equal(typeof unspy, "undefined", "'unspy' is not available globally after teardown");
  equal(typeof stub, "undefined", "'stub' is not available globally after teardown");
  equal(typeof unstub, "undefined", "'unstub' is not available globally after teardown");
  equal(typeof mock, "undefined", "'mock' is not available globally after teardown");
  equal(typeof unmock, "undefined", "'unmock' is not available globally after teardown");
});

test("with conflicts", function() {
  window.spy = 1;
  window.unspy = 1;
  window.stub = 1;
  window.unstub = 1;
  window.mock = 1;
  window.unmock = 1;

  jstest.setup();

  equal(typeof spy, "function", "'spy' is overwritten globally after setup");
  equal(typeof unspy, "function", "'unspy' is overwritten globally after setup");
  equal(typeof stub, "function", "'stub' is overwritten globally after setup");
  equal(typeof unstub, "function", "'unstub' is overwritten globally after setup");
  equal(typeof mock, "function", "'mock' is overwritten globally after setup");
  equal(typeof unstub, "function", "'unmock' is overwritten globally after setup");

  jstest.teardown();

  equal(typeof spy, "number", "'spy' is restored globally after teardown");
  equal(typeof unspy, "number", "'unspy' is restored globally after teardown");
  equal(typeof stub, "number", "'stub' is restored globally after teardown");
  equal(typeof unstub, "number", "'unstub' is restored globally after teardown");
  equal(typeof mock, "number", "'mock' is restored globally after teardown");
  equal(typeof unmock, "number", "'unmock' is restored globally after teardown");

  var undefined;

  try {
    delete window.spy;
    delete window.unspy;
    delete window.stub;
    delete window.unstub;
    delete window.mock;
    delete window.unmock;
  } catch (e) {
    window.spy = undefined;
    window.unspy = undefined;
    window.stub = undefined;
    window.unstub = undefined;
    window.mock = undefined;
    window.unmock = undefined;
  }
});

module("spy");

test("basic spying and unspying", function() {
  var foo = jstest.spy(function(a) {
    return a;
  });

  equal(foo.calls.length, 0, "number of calls is 0");

  foo();

  equal(foo.calls.length, 1, "number of calls is now 1");
  same(foo.calls[0].arguments, [], "call had no arguments");
  same(foo.calls[0].returned, undefined, "return value was recorded");

  foo(1, 2 , 3);

  equal(foo.calls.length, 2, "number of calls is now 2");
  same(foo.calls[1].arguments, [1, 2, 3], "call had the right arguments");
  equal(foo.calls[1].returned, 1, "return value was recorded");

  equal(foo(5), 5, "return value was passed through correctly");

  foo = jstest.unspy(foo);

  equal(foo(10), 10, "foo still works");
  equal(typeof foo.calls, "undefined", "foo no longer has the calls attribute");

  foo = jstest.spy(foo);

  equal(foo.calls.length, 0, "after re-spying, foo has an empty calls array");

  jstest.unspy(foo);
});

test("automatic spy attachment in namespace", function() {
  var foo = {
    bar: function() {
      return this._baz;
    },
    _baz: 1
  };

  jstest.spy(foo, "bar");

  equal(foo.bar(), 1, "return value was passed");
  equal(foo.bar.calls.length, 1, "calls list is there");

  jstest.unspy(foo, "bar");

  equal(foo.bar(), 1, "foo.bar still works after unspying");
  equal(typeof foo.bar.calls, "undefined", "foo.bar no longer has the calls attribute");

  function baz(){};
  baz.foo = function() { return 1; };

  jstest.spy(baz, "foo");
  baz.foo();
  equal(baz.foo.calls.length, 1, "could do spy attachment when namespace is a function");

  jstest.unspy(baz, "foo");
  equal(typeof baz.foo.calls, "undefined", "could unspy when namespace is a function");
});

test("automatic spy attachment to globals", function() {
  window.foo = function(a) {
   return a;
  };

  jstest.spy("foo");

  foo();

  equal(foo.calls.length, 1, "foo has calls");

  jstest.unspy("foo");

  equal(foo(1), 1, "foo still works");
  equal(typeof foo.calls, "undefined", "foo no longer has the calls attribute");

  try {
    delete window.foo;
  } catch (e) {
    var undefined;
    window.foo = undefined;
  }

  window.bar = {
    baz: function() {
      return this._foo;
    },

    _foo: 1
  };

  jstest.spy("bar.baz");

  equal(bar.baz(), 1, "bar.baz works");
  equal(bar.baz.calls.length, 1, "bar.baz has been spied");

  jstest.unspy("bar.baz");

  equal(bar.baz(), 1, "bar.baz works after unspying");
  equal(typeof bar.baz.calls, "undefined", "bar.baz no long has the calls attribute");
});

module("stub");

test("basic stubbing and unstubbing", function() {
  var foo = jstest.stub(function(x) {
    return x;
  }, function(x) {
    return x + 1;
  });

  equal(foo(1), 2, "stubbed a function reference");

  foo = jstest.unstub(foo);

  equal(foo(1), 1, "function reference was unstubbed");

  foo = jstest.stub(foo, function() {
    return 3;
  });

  equal(foo(), 3, "function could be re-stubbed");

  jstest.unstub(foo);
});

test("automatic stub attachment in namespace", function() {
  var foo = {
    bar: function(x) {
      return x;
    },

    _baz: 10
  };

  jstest.stub(foo, "bar", function(x) {
    return this._baz;
  });

  equal(foo.bar(), 10, "stubbing in namespace worked, and context was preserved");

  jstest.unstub(foo, "bar");

  equal(foo.bar(3), 3, "unstubbing in namespace worked");
});

test("automatic stub attachment to globals", function() {
  window.foo = {
    bar: function(x) {
      return x;
    },

    _baz: 10
  };

  jstest.stub("foo.bar", function() {
    return 3;
  });

  equal(foo.bar(), 3, "stubbing in global namespace worked");

  jstest.unstub("foo.bar");

  equal(foo.bar(5), 5, "unstubbing in global namespace worked");

  try {
    delete window.foo;
  } catch (e) {
    var undefined;
    window.foo = undefined;
  }
});

module("timecontrol");

asyncTest("the global setTimeout isn't screwed up by jstest's meddling", function() {
  setTimeout(function() {
    ok(true, "setTimeout isn't messed up");

    window.setTimeout(function() {
      ok(true, "and window.setTimeout works");

      jstest.setup();
      jstest.teardown();

      setTimeout(function() {
        ok(true, "setTimeout still isn't messed up after a setup and a teardown");

        window.setTimeout(function() {
          ok(true, "and window.setTimeout is also good after the teardown");

          start();
        }, 0);
      }, 0);
    }, 0);
  }, 0);
});

test("timer functions get replaced", function() {
  jstest.setup();

  equal(setTimeout(), "stubbed", "setTimeout was replaced");
  equal(clearTimeout(), "stubbed", "clearTimeout was replaced");
  equal(setInterval(), "stubbed", "setInterval was replaced");
  equal(clearInterval(), "stubbed", "clearInterval was replaced");

  equal(window.setTimeout(), "stubbed", "window.setTimeout was replaced too");

  jstest.teardown();
});

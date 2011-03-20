module("setup and teardown");

test("with no conflicts", function() {
  equal(typeof mock, "undefined", "'mock' is not available globally before setup");
  equal(typeof spy, "undefined", "'spy' is not available globally before setup");
  equal(typeof unspy, "undefined", "'unspy' is not available globally before setup");

  jstest.setup();

  equal(typeof mock, "function", "'mock' is available globally after setup");
  equal(typeof spy, "function", "'spy' is available globally after setup");
  equal(typeof unspy, "function", "'unuspy' is available globally after setup");

  jstest.teardown();

  equal(typeof mock, "undefined", "'mock' is not available globally after teardown");
  equal(typeof spy, "undefined", "'spy' is not available globally after teardown");
  equal(typeof unspy, "undefined", "'unspy' is not available globally after teardown");
});

test("with conflicts", function() {
  window.mock = window.spy = window.unspy = 1;

  jstest.setup();

  equal(typeof mock, "function", "'mock' is overwritten globally after setup");
  equal(typeof spy, "function", "'spy' is overwritten globally after setup");
  equal(typeof unspy, "function", "'unspy' is overwritten globally after setup");

  jstest.teardown();

  equal(typeof mock, "number", "'mock' is restored globally after teardown");
  equal(typeof spy, "number", "'spy' is restored globally after teardown");
  equal(typeof unspy, "number", "'unspy' is restored globally after teardown");

  delete window.mock;
  delete window.spy;
  delete window.unspy;
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

  delete window.foo;

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

module("mock");

module("timecontrol");

module("spy");

test("basic spying and unspying", function() {
  espionage.use(function() {
    var foo = spy(function(a) {
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

    foo = unspy(foo);

    equal(foo(10), 10, "foo still works");
    equal(typeof foo.calls, "undefined", "foo no longer has the calls attribute");

    foo = spy(foo);

    equal(foo.calls.length, 0, "after re-spying, foo has an empty calls array");

    unspy(foo);
  });
});

test("automatic spy attachment in namespace", function() {
  espionage.use(function() {
    var foo = {
      bar: function() {
        return this._baz;
      },
      _baz: 1
    };

    spy(foo, "bar");

    equal(foo.bar(), 1, "return value was passed");
    equal(foo.bar.calls.length, 1, "calls list is there");

    unspy(foo, "bar");

    equal(foo.bar(), 1, "foo.bar still works after unspying");
    equal(typeof foo.bar.calls, "undefined", "foo.bar no longer has the calls attribute");

    function baz(){};
    baz.foo = function() { return 1; };

    spy(baz, "foo");
    baz.foo();
    equal(baz.foo.calls.length, 1, "could do spy attachment when namespace is a function");

    unspy(baz, "foo");
    equal(typeof baz.foo.calls, "undefined", "could unspy when namespace is a function");
  });
});

test("automatic spy attachment to globals", function() {
  espionage.use(function() {
    window.foo = function(a) {
     return a;
    };

    spy("foo");

    foo();

    equal(foo.calls.length, 1, "foo has calls");

    unspy("foo");

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

    spy("bar.baz");

    equal(bar.baz(), 1, "bar.baz works");
    equal(bar.baz.calls.length, 1, "bar.baz has been spied");

    unspy("bar.baz");

    equal(bar.baz(), 1, "bar.baz works after unspying");
    equal(typeof bar.baz.calls, "undefined", "bar.baz no long has the calls attribute");
  });
});

test("spy with no args creates a generic anonymous spy", function() {
  espionage.use(function() {
    var s = spy();

    equal(typeof s, "function", "spy() is a function");

    s();

    equal(s.calls.length, 1, "spy() is a spy");

  });
});

test("all spies are unspied during teardown", function() {
  ok(false, "TODO");
});

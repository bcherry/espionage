module("spy");

test("basic spying and unspying", function() {
  espionage.use(function() {
    var foo = spy(function(a) {
      return a;
    });

    equal(debrief(foo).calls.length, 0, "number of calls is 0");

    foo();

    equal(debrief(foo).calls.length, 1, "number of calls is now 1");
    same(debrief(foo).calls[0].arguments, [], "call had no arguments");
    same(debrief(foo).calls[0].returned, undefined, "return value was recorded");

    foo(1, 2 , 3);

    equal(debrief(foo).calls.length, 2, "number of calls is now 2");
    same(debrief(foo).calls[1].arguments, [1, 2, 3], "call had the right arguments");
    equal(debrief(foo).calls[1].returned, 1, "return value was recorded");

    equal(foo(5), 5, "return value was passed through correctly");

    foo = unspy(foo);

    equal(foo(10), 10, "foo still works");

    foo = spy(foo);

    equal(debrief(foo).calls.length, 0, "after re-spying, foo has an empty calls array");

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
    equal(debrief(foo.bar).calls.length, 1, "calls list is there");

    unspy(foo, "bar");

    equal(foo.bar(), 1, "foo.bar still works after unspying");
    equal(debrief(foo.bar), false, "foo.bar can no longer be debriefed");

    function baz(){};
    baz.foo = function() { return 1; };

    spy(baz, "foo");
    baz.foo();
    equal(debrief(baz.foo).calls.length, 1, "could do spy attachment when namespace is a function");

    unspy(baz, "foo");
    equal(debrief(baz.foo), false, "could unspy when namespace is a function");
  });
});

test("automatic spy attachment to globals", function() {
  espionage.use(function() {
    var undefined;

    window.foo = function(a) {
     return a;
    };

    spy("foo");

    foo();

    equal(debrief(foo).calls.length, 1, "foo has calls");

    unspy("foo");

    equal(foo(1), 1, "foo still works");
    equal(debrief(foo), false, "foo can no longer be debriefed");

    window.foo = undefined;

    window.bar = {
      baz: function() {
        return this._foo;
      },

      _foo: 1
    };

    spy("bar.baz");

    equal(bar.baz(), 1, "bar.baz works");
    equal(debrief(bar.baz).calls.length, 1, "bar.baz has been spied");

    unspy("bar.baz");

    equal(bar.baz(), 1, "bar.baz works after unspying");
    equal(debrief(bar.baz), false, "bar.baz no longer can be debriefed");

    window.bar = undefined;
  });
});

test("spy with no args creates a generic anonymous spy", function() {
  espionage.use(function() {
    var s = spy();

    equal(typeof s, "function", "spy() is a function");

    s();

    equal(debrief(s).calls.length, 1, "spy() can be debriefed");
  });
});

test("all spies are unspied during teardown", function() {
  var undefined;

  var originalFoo = window.foo = function(){};
  espionage.setup();

  spy("foo");

  notEqual(foo, originalFoo, "foo was spied");

  espionage.teardown();

  equal(foo, originalFoo, "foo was unspied");

  window.foo = undefined;
});

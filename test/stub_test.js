module("stub");

test("basic stubbing and unstubbing", function() {
  espionage.use(function() {
    var foo = stub(function(x) {
      return x;
    }, function(x) {
      return x + 1;
    });

    equal(foo(1), 2, "stubbed a function reference");

    foo = unstub(foo);

    equal(foo(1), 1, "function reference was unstubbed");

    foo = stub(foo, function() {
      return 3;
    });

    equal(foo(), 3, "function could be re-stubbed");

    unstub(foo);
  });
});

test("automatic stub attachment in namespace", function() {
  espionage.use(function() {
    var foo = {
      bar: function(x) {
        return x;
      },

      _baz: 10
    };

    stub(foo, "bar", function(x) {
      return this._baz;
    });

    equal(foo.bar(), 10, "stubbing in namespace worked, and context was preserved");

    unstub(foo, "bar");

    equal(foo.bar(3), 3, "unstubbing in namespace worked");
  });
});

test("automatic stub attachment to globals", function() {
  espionage.use(function() {
    window.foo = {
      bar: function(x) {
        return x;
      },

      _baz: 10
    };

    stub("foo.bar", function() {
      return 3;
    });

    equal(foo.bar(), 3, "stubbing in global namespace worked");

    unstub("foo.bar");

    equal(foo.bar(5), 5, "unstubbing in global namespace worked");

    try {
      delete window.foo;
    } catch (e) {
      var undefined;
      window.foo = undefined;
    }
  });
});

test("stubs are unstubbed during teardown", function() {
  ok(false, "TODO");
});

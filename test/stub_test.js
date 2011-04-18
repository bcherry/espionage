module("stub");

test("stubbing/unstubbing in namespaces", function() {
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

test("stubbing/unstubbing in globals", function() {
  espionage.use(function() {
    var undefined;
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

    window.foo = undefined;
  });
});

test("stubs are unstubbed during teardown", function() {
  var undefined;
  window.foo = function(){ return 1; };

  espionage.setup();

  stub("foo", function() { return 2; });

  equal(foo(), 2, "foo got stubbed");

  espionage.teardown();

  equal(foo(), 1, "foo got unstubbed by teardown");

  window.foo = undefined;
});

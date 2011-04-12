module("stub");

test("basic stubbing and unstubbing", function() {
  var foo = espionage.stub(function(x) {
    return x;
  }, function(x) {
    return x + 1;
  });

  equal(foo(1), 2, "stubbed a function reference");

  foo = espionage.unstub(foo);

  equal(foo(1), 1, "function reference was unstubbed");

  foo = espionage.stub(foo, function() {
    return 3;
  });

  equal(foo(), 3, "function could be re-stubbed");

  espionage.unstub(foo);
});

test("automatic stub attachment in namespace", function() {
  var foo = {
    bar: function(x) {
      return x;
    },

    _baz: 10
  };

  espionage.stub(foo, "bar", function(x) {
    return this._baz;
  });

  equal(foo.bar(), 10, "stubbing in namespace worked, and context was preserved");

  espionage.unstub(foo, "bar");

  equal(foo.bar(3), 3, "unstubbing in namespace worked");
});

test("automatic stub attachment to globals", function() {
  window.foo = {
    bar: function(x) {
      return x;
    },

    _baz: 10
  };

  espionage.stub("foo.bar", function() {
    return 3;
  });

  equal(foo.bar(), 3, "stubbing in global namespace worked");

  espionage.unstub("foo.bar");

  equal(foo.bar(5), 5, "unstubbing in global namespace worked");

  try {
    delete window.foo;
  } catch (e) {
    var undefined;
    window.foo = undefined;
  }
});

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

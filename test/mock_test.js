module("mock");

test("works with setup and teardown", function() {
  var foo = { bar: function(){ return 1; } };

  espionage.setup();

  mock(foo, "bar").returns(2);

  equal(foo.bar(), 2, "it mocked ok");

  espionage.teardown();

  equal(foo.bar(), 1, "unmocked after teardown");
});

test("unmock", function() {
  var foo = { bar: function(){ return 1; } };

  espionage.mock(foo, "bar").returns(2);
  espionage.unmock(foo, "bar");

  equal(foo.bar(), 1, "unmock worked fine");
});

test("reuses mockers when mocking twice", function() {
  window.foo = {bar: function(){}};

  equal(espionage.mock("foo.bar"), espionage.mock("foo.bar"), "mock twice are equal");

  delete window.foo;
});

test("basic mocking", function() {
  espionage.use(function() {
    window.foo = {
      bar: function(a) {
        return a + 1;
      }
    };

    mock("foo.bar").withArgs(1).returns(3);

    equal(foo.bar(1), 3, "foo.bar(1) returns as mocked");

    raises(function() {
      foo.bar(2);
    }, espionage.UnexpectedInvocationError, "unexpected invocation raises exception");

    mock("foo.bar").withArgs(1, 2).returns(4);

    equal(foo.bar(1, 2), 4, "foo.bar(1, 2) returns as mocked");
    equal(foo.bar(1), 3, "foo.bar(1) still works too");

    delete window.foo;
  });
});

test("atMost", function() {
  var foo = {
    bar: function() {}
  };

  espionage.use(function() {
    mock(foo, "bar").withArgs(1).returns(3).atMost(1);

    foo.bar(1);

    raises(function() {
      foo.bar(1);
    }, espionage.UnexpectedInvocationError, "second invocation raises");
  });
});

test("atLeast", function() {
  var foo = {
    bar: function() {}
  };

  espionage.mock(foo, "bar").atLeast(1);

  raises(function() {
    espionage.unmock(foo, "bar");
  }, espionage.TooFewInvocationsError, "unmocking without enough calls raises");
});
    // mock("foo.bar").withArgs(1, 2).returns(3).atLeast(1);
    // mock("foo.bar").withArgs(1, 2).returns(3).atMost(10);
    // mock("foo.bar").withArgs(1, 2).returns(3).exactly(3);
    // mock("foo.bar").withArgs(1, 2).returns(3).atMost(10);
    //
    // mock("foo.bar").allowUnexpectedInvocations();
    //
    // mock("foo.bar").atLeastOnce().withArgs(1, 2))
    //
    //
    //
    //
    // mock("foo.bar").argsSatisfy(function(a, b) {
    //   a.should == 1;
    // });
    //
    // mock("foo.bar").returnSatisifies(function(a, b) {
    //   a.should == 1;
    // });



  // withArgs
  // withAnyArgs
  // returns
  // argsSatisfy
  // returnSatisfies
  // atLeast
  // atMost
  // exactly
  // allowUnexpectedInvocations

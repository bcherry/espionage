module("mock");

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



    // mock("foo.bar").withArgs(1, 2).returns(4);
    //
    // equal(foo.bar(1, 2), 4, "foo.bar(1, 2) returns as mocked");
    // equal(foo.bar(1), 3, "foo.bar(1) still works too");
    //
    // mock("foo.bar").withArgs(1, 2).returns(3).atLeastOnce();
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

    delete window.foo;
  });
});


  // withArgs
  // withAnyArgs
  // returns
  // argsSatisfy
  // returnSatisfies
  // atLeast
  // atMost
  // exactly
  // allowUnexpectedInvocations
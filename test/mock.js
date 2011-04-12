module("mock");

test("basic mocking", function() {
  espionage.use(function() {
    window.foo = {
      bar: function(a) {
        return a + 1;
      }
    };

    mock("foo.bar");

    equal(foo.bar(1), 2, "foo.bar() still works after mocking");
    // mock("foo.bar").withArgs(1, 2).returns(3);
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
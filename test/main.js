module("setup and teardown");

test("with no conflicts", function() {
  equal(typeof spy, "undefined", "'spy' is not available globally before setup");

  jstest.setup();

  equal(typeof spy, "function", "'spy' is available globally after setup");

  jstest.teardown();

  equal(typeof spy, "undefined", "'spy' is not available globally after teardown");
});

test("with conflicts", function() {
  window.spy = 1;

  jstest.setup();

  equal(typeof spy, "function", "'spy' is overwritten globally after setup");

  jstest.teardown();

  equal(typeof spy, "number", "'spy' is restored globally after teardown");

  var undefined;

  try {
    delete window.spy;
  } catch (e) {
    window.spy = undefined;
  }
});

test("use", function() {
  expect(2);
  jstest.use(function() {
    equal(typeof spy, "function", "use sets things up");
  });

  equal(typeof spy, "undefined", "and then tears them down");
});
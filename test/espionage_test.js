module("setup and teardown");

test("with no conflicts", function() {
  equal(typeof spy, "undefined", "'spy' is not available globally before setup");

  espionage.setup();

  equal(typeof spy, "function", "'spy' is available globally after setup");

  espionage.teardown();

  equal(typeof spy, "undefined", "'spy' is not available globally after teardown");
});

test("with conflicts", function() {
  window.spy = 1;

  espionage.setup();

  equal(typeof spy, "function", "'spy' is overwritten globally after setup");

  espionage.teardown();

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
  espionage.use(function() {
    equal(typeof spy, "function", "use sets things up");
  });

  equal(typeof spy, "undefined", "and then tears them down");
});

test("extendTeardown", function() {
  var ranGood = false;
  function good() {
    ranGood = true;
  }

  function bad() {
    throw "foo";
  }

  espionage.extendTeardown(good);

  espionage.setup();
  espionage.teardown();

  equal(ranGood, true, "tearing down ran the new teardown function");

  ranGood = false;

  espionage.unextendTeardown(good);

  espionage.setup();
  espionage.teardown();

  equal(ranGood, false, "unextending teardown stopped the new function from running");

  ranGood = false;

  espionage.extendTeardown(bad);
  espionage.extendTeardown(good);

  espionage.setup();

  raises(function() {
    espionage.teardown();
  }, "foo", "teardown threw as expected");

  equal(ranGood, true, "but the exception didn't stop the rest of the teardown from happening");

  espionage.unextendTeardown(good);
  espionage.unextendTeardown(bad);
});

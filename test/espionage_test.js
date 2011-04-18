module("espionage");

test("use", function() {
  var oldSetup = espionage.setup,
      oldTeardown = espionage.teardown,
      setup = false,
      teardown = false;

  espionage.setup = function() {
    setup = true;
  };

  espionage.teardown = function() {
    teardown = true;
  };

  espionage.use(function() {
    equal(setup, true, "use set things up");
    equal(teardown, false, "without tearing them down");
  });
  equal(teardown, true, "but eventually it tore them down");

  espionage.setup = oldSetup;
  espionage.teardown = oldTeardown;
});

test("extend", function() {
  var fooRun, fooSetup, fooTeardown;

  espionage.extend("foo", function(e) {
    e.extendGlobals("foo", function() {
      fooRun = true;
    });

    e.extendSetup(function() {
      fooSetup = true;
    });

    e.extendTeardown(function() {
      fooTeardown = true;
    });
  });

  espionage.setup();
  equal(fooSetup, true, "foo's setup extension was run");

  window.foo();
  equal(fooRun, true, "foo() was run");

  espionage.teardown();
  equal(fooTeardown, true, "foo's teardown extension was run");

  espionage.unextend("foo");
});

test("unextend", function() {
  var fooSetup = false, fooTeardown = false;
  espionage.extend("foo", function(e) {
    e.extendGlobals("foo", function() {});

    e.extendSetup(function() {
      fooSetup = true;
    });

    e.extendTeardown(function() {
      fooTeardown = true;
    });
  });
  espionage.unextend("foo");

  espionage.setup();
  equal(fooSetup, false, "fooSetup was not run");

  equal(typeof window.foo, "undefined", "foo was removed from globals");

  espionage.teardown();
  equal(fooTeardown, false, "fooTeardown was not run");

  espionage.unextend("foo");
});

test("extend with global conflicts", function() {
  window.foo = 1;

  espionage.extend("foo", function(e) {
    e.extendGlobals("foo", function() {});
  });

  espionage.setup();

  equal(typeof foo, "function", "'foo' is overwritten globally after setup");

  espionage.teardown();

  equal(typeof foo, "number", "'foo' is restored globally after teardown");

  var undefined;

  window.foo = undefined;

  espionage.unextend("foo");
});

test("extend with exceptions", function() {
  var fooSetup = false,
      fooTeardown = false,
      barSetup = false,
      barTeardown = false;

  espionage.extend("foo", function(e) {
    e.extendSetup(function() {
      fooSetup = true;
      throw "setup exception";
    });

    e.extendTeardown(function() {
      fooTeardown = true;
      throw "teardown exception";
    });
  });

  espionage.extend("bar", function(e) {
    e.extendSetup(function() {
      barSetup = true;
      throw "setup exception";
    });

    e.extendTeardown(function() {
      barTeardown = true;
      throw "teardown exception";
    });
  });

  raises(function() {
    espionage.setup();
  }, /^setup exception$/, "setup threw the exception");

  equal(fooSetup, true, "foo's setup completed despite the exception");
  equal(barSetup, true, "bar's setup completed despite the exception");

  raises(function() {
    espionage.teardown();
  }, /^teardown exception$/, "teardown threw the exception");

  equal(fooTeardown, true, "foo's teardown completed despite the exception");
  equal(barTeardown, true, "bar's teardown completed despite the exception");

  espionage.unextend("foo");
  espionage.unextend("bar");
});

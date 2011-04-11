module("time");

asyncTest("the global setTimeout isn't screwed up by jstest's meddling", function() {
  setTimeout(function() {
    ok(true, "setTimeout isn't messed up");

    window.setTimeout(function() {
      ok(true, "and window.setTimeout works");

      jstest.setup();
      jstest.teardown();

      setTimeout(function() {
        ok(true, "setTimeout still isn't messed up after a setup and a teardown");

        window.setTimeout(function() {
          ok(true, "and window.setTimeout is also good after the teardown");

          start();
        }, 0);
      }, 0);
    }, 0);
  }, 0);
});

test("you can control time", function() {
  jstest.setup();

  var f = spy();
  setTimeout(f, 100);

  wait(50);
  equal(f.calls.length, 0, "f hasn't been called after waiting 50");

  wait(50);
  equal(f.calls.length, 1, "f was called once after waiting another 50");

  f = spy();
  var t = setTimeout(f, 100);
  clearTimeout(t);

  wait(100);
  equal(f.calls.length, 0, "f didn't called when clearTimeout was used");

  f = spy();
  t = setInterval(f, 10);
  equal(f.calls.length, 0, "f wasn't called after setInterval");

  wait(10);
  equal(f.calls.length, 1, "f was called once after 10");

  wait(10);
  equal(f.calls.length, 2, "f was called after another 10");

  wait(9);
  equal(f.calls.length, 2, "f was not called a third time after 9 more");

  wait(1);
  equal(f.calls.length, 3, "f was called a third time after 1 more");

  wait(30);
  equal(f.calls.length, 6, "f was called three more times after 30 more");

  clearInterval(t);

  wait(50);
  equal(f.calls.length, 6, "but f wasn't called anymore after clearInterval");

  f = spy();
  g = spy();
  h = spy();
  setInterval(f, 10);
  setTimeout(g, 100);
  setTimeout(h, 50);

  wait(50);
  equal(f.calls.length, 5, "with many timers, setInterval works");
  equal(g.calls.length, 0, "with many timers, a long setTimeout works");
  equal(h.calls.length, 1, "with many timers, a shorter setTimeout works");

  jstest.teardown();
});

test("timer edge cases", function() {
  expect(1);

  jstest.setup();

  var executed = 0;

  setTimeout("ok(true, 'calling setTimeout with a string worked');", 10);

  wait(10);

  jstest.teardown();
});

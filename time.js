// So we can safely override these later
// See: http://www.adequatelygood.com/2011/4/Replacing-setTimeout-Globally
window.setTimeout = window.setTimeout;
window.clearTimeout = window.clearTimeout;
window.setInterval = window.setInterval;
window.clearInterval = window.clearInterval;

espionage.extend("time", function(e) {
  var timers = [],
      globalTime = 0,
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("wait", function(time) {
    globalTime += time;

    for (var i = 0; i < timers.length; i++) {
      var timer = timers[i];
      if (timer) {
        if (timer.next <= globalTime) {
          if (timer.repeat) {
            do {
              timer.fn.call();
              timer.next += timer.time;
            } while (timer.next <= globalTime);
          } else {
            timer.fn.call();
            delete timers[i];
          }
        }
      }
    }
  });

  e.extendGlobals("setTimeout", function(fn, time) {
    return generateTimer(fn, time, false);
  });

  e.extendGlobals("clearTimeout", function(id) {
    return clearTimer(id);
  });

  e.extendGlobals("setInterval", function(fn, time) {
    return generateTimer(fn, time, true);
  });

  e.extendGlobals("clearInterval", function(id) {
    return clearTimer(id);
  });

  function generateTimer(fn, time, repeat) {
    if (typeof fn === "string") {
      fn = new Function(fn);
    }
    timers.push({
      fn: fn,
      time: time,
      next: globalTime + time,
      repeat: repeat
    });

    return timers.length - 1;
  }

  function clearTimer(id) {
    delete timers[id];
  }

});

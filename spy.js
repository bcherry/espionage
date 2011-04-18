espionage.extend("spy", function(e) {
  var spiedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("spy", function(namespace, property) {
    if (typeof property == "undefined") {
      if (typeof namespace === "function") {
        return generateSpy(namespace);
      } else if (typeof namespace === "undefined") {
        return generateSpy();
      }
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = generateSpy(namespace[property], namespace, property);
  });

  e.extendGlobals("unspy", function(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findSpied(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findSpied(namespace[property]).original;
  });

  e.extendTeardown(function() {
    for (var i = 0; i < spiedFunctions.length; i++) {
      var spied = spiedFunctions[i];
      if (spied.namespace) {
        spied.namespace[spied.property] = spied.original;
      }
    }

    spiedFunctions = [];
  });

  function generateSpy(fn, namespace, property) {
    fn = fn || function(){};

    function spied() {
      var args = Array.prototype.slice.apply(arguments),
          returned = fn.apply(this, args);

      spied.calls.push({
        arguments: args,
        returned: returned
      });

      return returned;
    }

    spied.calls = [];

    spiedFunctions.push({
      spied: spied,
      original: fn,
      namespace: namespace,
      property: property
    });

    return spied;
  }

  function findSpied(spied) {
    for (var i = 0; i < spiedFunctions.length; i++) {
      if (spiedFunctions[i].spied === spied) {
        return spiedFunctions[i];
      }
    }
  }

});

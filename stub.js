espionage.extend("stub", function(e) {
  var stubbedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  e.extendGlobals("stub", function(namespace, property, value) {
    if (typeof namespace === "string") {
      value = property;
      property = namespace;
      namespace = window;
    }
    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    stubbedFunctions.push({
      original: namespace[property],
      stubbed: value,
      namespace: namespace,
      property: property
    });

    namespace[property] = value;
  });

  e.extendGlobals("unstub", function(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findStubbed(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findStubbed(namespace[property]).original;
  });

  e.extendTeardown(function() {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      var stubbed = stubbedFunctions[i];

      stubbed.namespace[stubbed.property] = stubbed.original;
    }
    stubbedFunctions = [];
  });


  function findStubbed(stubbed) {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      if (stubbedFunctions[i].stubbed === stubbed) {
        return stubbedFunctions[i];
      }
    }
  }

});

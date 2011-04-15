(function(espionage) {
  var stubbedFunctions = [],
      resolveNamespace = espionage._util.resolveNamespace;

  espionage.extend("stub", function(namespace, property, value) {
    if (typeof namespace === "function" && typeof property == "function") {
      return generateStub(namespace, property);
    }

    if (typeof property === "function" && typeof value === "undefined") {
      value = property;
      property = undefined;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = generateStub(namespace[property], value);
  });

  espionage.extend("unstub", function(namespace, property) {
    if (typeof namespace === "function" && typeof property == "undefined") {
      return findStubbed(namespace).original;
    }

    var resolved = resolveNamespace(namespace, property);
    namespace = resolved.namespace;
    property = resolved.property;

    namespace[property] = findStubbed(namespace[property]).original;
  });


  function generateStub(original, stubbed) {
    stubbedFunctions.push({
      original: original,
      stubbed: stubbed
    });

    return stubbed;
  }

  function findStubbed(stubbed) {
    for (var i = 0; i < stubbedFunctions.length; i++) {
      if (stubbedFunctions[i].stubbed === stubbed) {
        return stubbedFunctions[i];
      }
    }
  }

}(espionage));

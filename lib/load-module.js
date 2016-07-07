// hack into `loadModule` method

'use strict';

const LoaderDependency = require('webpack/lib/dependencies/LoaderDependency');

module.exports = function loadModule(context, request, callback) {
  const dep = new LoaderDependency(request);
  dep.loc = request;

  context._compilation.addModuleDependencies(context._module, [
    [dep],
  ], true, 'lm', false, (err) => {
    if (err) return callback(err);
    if (!dep.module) return callback(new Error('Cannot load the module'));
    if (dep.module.building) dep.module.building.push(next);
    else next();

    function next(err) {
      if (err) return callback(err);

      if (dep.module.error) return callback(dep.module.error);
      if (!dep.module._source) throw new Error('The module created for a LoaderDependency must have a property _source');

      return callback(null, dep.module._source.source());
    }
  });
};


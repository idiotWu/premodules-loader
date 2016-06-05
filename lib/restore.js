/**
 * @premodules?restore
 *   1. get `exports.locals = {...}` part
 *   2. iterate through it and find twice transformed prop (i.e. prop inherited from parent)
 *   3. replace the prop with source prop (dependency prop name)
 */

const store = require('./store');
const debugLog = require('./debug-log');

/**
 * Example input:
 *    exports.locals = {
 *      "test": "src-example-___style__test___2lVz0"
 *    };
 */

const regex = /exports\.locals\s*=\s*([^;]+);?/;
//                                   $1: js object

/**
 * Restore twice transformed props
 *   e.g. { asdfas_asdf_asf: "xzkjn_ljjn_asdf" } => { list: "asdfas_asdf_asf" }
 */
const restoreClasses = (result, deps, cssReplaceMap) => {
  if (!deps) return;

  deps.forEach(path => {
    const classNames = store.modules[path];

    if (!classNames) return;

    Object.keys(classNames).forEach(key => {
      const scoped = classNames[key];

      // replace interpolated prop with source prop
      // save them to cssReplaceMap for css replacement
      if (result[scoped]) {
        cssReplaceMap[result[scoped]] = scoped;
        delete result[scoped];
        result[key] = scoped;
      }
    });
  });
};

module.exports = function restore(source) {
  this.cacheable && this.cacheable();

  const cwd = this.resourcePath;
  const deps = store.depsMap[cwd];

  debugLog(`@restore: start restoring ${cwd}`);

  const cssReplaceMap = {};

  // restore output classes
  source = source.replace(regex, (match, resultStr) => {
    const result = JSON.parse(resultStr);

    restoreClasses(result, deps, cssReplaceMap);

    store.modules[cwd] = result;

    if (store.pendingDeps[cwd]) {
      store.pendingDeps[cwd].forEach(deferred => deferred.resolve());

      debugLog(`@restore: resolve pending ${cwd}`);
    }

    return `exports.locals = ${JSON.stringify(result)};`;
  });

  // also restore css parts
  Object.keys(cssReplaceMap).forEach(prop => {
    source = source.replace(prop, cssReplaceMap[prop]);
  });

  debugLog(`@restore: finish restoring ${cwd}`);

  // ensure resolved with new value
  // single-thread javascript ensures restore is called after all parses executed
  if (--store.processing === 0) {
    store.reset();

    debugLog('all modules are processed!');
  }

  return source;
};

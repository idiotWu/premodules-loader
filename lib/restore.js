/**
 * @premodules?restore
 *   1. get `exports.locals = {...}` part
 *   2. iterate through it and find twice transformed prop (i.e. prop inherited from parent)
 *   3. replace the prop with source prop (dependency prop name)
 */

const regex = require('./regex');
const store = require('./store');
const debugLog = require('./debug-log');

/**
 * Restore twice transformed props
 *   e.g. { asdfas_asdf_asf: "xzkjn_ljjn_asdf" } => { list: "asdfas_asdf_asf" }
 */
const restoreClasses = (result, deps) => {
  const cssReplaceMap = {};
  const transformed = Object.assign({}, result);

  if (deps) {
    deps.forEach(path => {
      const classNames = store.resolved[path];

      if (!classNames) return;

      Object.keys(classNames).forEach(key => {
        const scoped = classNames[key];

        // replace interpolated prop with source prop
        // save them to cssReplaceMap for css replacement
        if (result[scoped]) {
          cssReplaceMap[result[scoped]] = scoped;

          delete transformed[scoped];
          transformed[key] = scoped;
        }
      });
    });
  }

  return { transformed, cssReplaceMap };
};

module.exports = function restore(source) {
  this.cacheable && this.cacheable();

  const cwd = this.resourcePath;
  const deps = store.requireMap[cwd];

  const cssReplaceMap = {};

  // restore output classes
  source = source.replace(regex.output, (match, resultStr) => {
    const result = restoreClasses(JSON.parse(resultStr), deps);

    Object.assign(cssReplaceMap, result.cssReplaceMap);

    return `exports.locals = ${JSON.stringify(result.transformed)};`;
  });

  // also restore css parts
  Object.keys(cssReplaceMap).forEach(prop => {
    source = source.replace(prop, cssReplaceMap[prop]);
  });

  debugLog(`@restore: finish restoring ${cwd}`);

  return source;
};

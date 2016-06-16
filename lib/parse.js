/**
 * @premodules?parse
 *   1. replace `@module './comp.scss' => $comp` with stored module
 *   2. map dependencies [path_of_source] => [...path_of_deps]
 */
'use strict';

const path = require('path');
const store = require('./store');
const debugLog = require('./debug-log');

const regex = /@module\s+(['"])([^'"]+)\1\s+=>\s+([^;]+);?$/mg;
//                       $1    $2                $3
// $1: quote
// $2: source path
// $3: variable name

function Defer(src) {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = val => {
      clearTimeout(this.timer);
      resolve(val);
    };

    this.reject = reject;
  });

  this.timer = setTimeout(() => {
    this.reject(new Error(`[premodules]: resolve ${src} timeout, this may be caused by circular dependencies`));
  }, 60 * 1e3);
}

const getPath = (src, cwd) => {
  // relative path
  if (/^\./.test(src)) return path.join(path.dirname(cwd), src);

  // node modules
  return require.resolve(src);
};

const scssTransformer = (varName, hash) => {
  if (!hash) return '';

  const main = Object.keys(hash).map(key => `${key}: '.${hash[key]}'`).join(',');

  return `${varName}: (${main});`;
};

/**
 * Compile directive to pre-processors' object
 *   `@module './comp.scss' => $comp` -> `$comp: ( key: value, ... )`
 */
module.exports = function parse(source) {
  this.async();
  store.processing++;

  const cwd = this.resourcePath;
  const deps = store.depsMap[cwd] = new Set();
  const transformer = (this.options.premodules && typeof this.options.premodules.transformer === 'function') ? this.options.premodules.transformer : scssTransformer;

  debugLog(`@parse: start parsing ${cwd}`);

  let matches = regex.exec(source);
  const promises = [];

  while (matches) {
    const src = getPath(matches[2], cwd);
    deps.add(src);

    if (!store.modules[src]) {
      const deferred = new Defer(src);

      store.pendingDeps[src] = store.pendingDeps[src] || [];
      store.pendingDeps[src].push(deferred);

      promises.push(deferred.promise);
      debugLog(`@pending: waiting module ${src}`);
    }

    matches = regex.exec(source);
  }

  Promise.all(promises)
    .then(() => {
      debugLog(`@parse: start replacing ${cwd}`);
      source = source.replace(regex, (match, quote, depPath, varName) => {
        depPath = getPath(depPath, cwd);
        const result = transformer(varName, store.modules[depPath]);

        if (!result) throw new ReferenceError(`[premodules]: ${depPath} not found`);

        debugLog(`@parse: replaced \`${match}\` with \`${result}\``);

        return result;
      });

      this.callback(null, source);

      debugLog(`@parse: finish parsing ${cwd}`);
    })
    .catch(err => {
      this.callback(err);
    });
};

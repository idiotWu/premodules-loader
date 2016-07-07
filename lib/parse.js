/**
 * @premodules?parse
 *   1. replace `@module './comp.scss' => $comp` with stored module
 *   2. map dependencies [path_of_source] => [...path_of_deps]
 */
'use strict';

const path = require('path');
const regex = require('./regex');
const store = require('./store');
const debugLog = require('./debug-log');

const getPath = (src, cwd) => {
  // relative path
  if (/^\./.test(src)) return path.join(path.dirname(cwd), src);

  // node modules
  return require.resolve(src);
};

const parseOutput = (str) => {
  const matches = str.match(regex.output);

  if (!matches) return null;

  return JSON.parse(matches[1]);
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
  this.async && this.async();

  const cwd = this.resourcePath;
  const options = this.options.premodules || {};
  const transformer = typeof options.transformer === 'function' ? options.transformer : scssTransformer;

  const deps = store.requireMap[cwd] = new Set();

  debugLog(`@parse: start parsing ${cwd}`);

  let matches = null;
  const promises = [];

  // eslint-disable-next-line no-cond-assign
  while (matches = regex.directive.exec(source)) {
    const src = getPath(matches[2], cwd);
    deps.add(src);

    debugLog(`@deps: loading module ${src}`);

    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[premodules]: resolve ${src} timeout, this may be caused by circular dependencies`));
      }, 60 * 1e3);

      this.loadModule(src, (err, output) => {
        clearTimeout(timer);

        if (err) return reject(err);

        const result = parseOutput(output);
        store.resolved[src] = result; // keep newest

        resolve(result);
      });
    });

    promises.push(promise);
  }

  Promise.all(promises)
    .then(() => {
      debugLog(`@parse: start replacing ${cwd}`);
      source = source.replace(regex.directive, (match, quote, depPath, varName) => {
        depPath = getPath(depPath, cwd);
        const result = transformer(varName, store.resolved[depPath]);

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

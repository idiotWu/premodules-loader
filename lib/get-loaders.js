'use strict';

const resultCache = {};
const loadersMap = new Map();
const stripOutputLoader = require.resolve('./strip-output-loader');

const formatLoaders = (source) => {
  if (!source) return [];
  if (source instanceof Array) return source;

  return source.split('!');
};

module.exports = function getLoaders(context) {
  let res = '';
  const resourcePath = context.resourcePath;

  if (resultCache[resourcePath]) return resultCache[resourcePath];

  if (!loadersMap.size) {
    context.options.module.loaders
      .filter(config =>
        formatLoaders(config.loaders).some(loader => loader.match('premodules'))
      )
      .forEach(config => {
        const rules = {
          test: config.test,
          include: [],
        };

        if (config.include) {
          if (config.include instanceof Array) {
            config.include.forEach(path => {
              rules.include.push(new RegExp(path));
            });
          } else {
            rules.include.push(new RegExp(config.include));
          }
        }

        // strip all loaders after premodules?restore
        const loaders = formatLoaders(config.loaders)
          .join('!')
          .replace(/^.*?(?=premodules\?restore)/, '');

        loadersMap.set(rules, `${stripOutputLoader}!${loaders}`);
      });
  }

  loadersMap.forEach((loaders, rules) => {
    if (res) return;

    let matched = true;

    matched &= rules.test.test(resourcePath);

    if (rules.include.length) {
      matched &= rules.include.some(r => {
        return resourcePath.match(r);
      });
    }

    if (matched) res = loaders;
  });

  resultCache[resultCache] = res;

  return res;
};

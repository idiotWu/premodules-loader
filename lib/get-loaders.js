'use strict';

const cacheMap = new Map();
const stripOutputLoader = require.resolve('./strip-output-loader');

const formatLoaders = (source) => {
  if (!source) return [];
  if (source instanceof Array) return source;

  return source.split('!');
};

module.exports = function getLoaders(context) {
  let res = '';
  const resourcePath = context.resourcePath;

  if (!cacheMap.size) {
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

        // strip style loader
        const loaders = formatLoaders(config.loaders).filter(l => !/^style/.test(l));

        // prepend strip-output loader
        loaders.unshift(stripOutputLoader);

        cacheMap.set(rules, loaders.join('!'));
      });
  }

  cacheMap.forEach((loaders, rules) => {
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

  return res;
};

'use strict';

const cacheMap = new Map();

module.exports = function getLoaders(context) {
  let res = '';
  const resourcePath = context.resourcePath;

  if (!cacheMap.size) {
    context.options.module.loaders
      .filter(config =>
        config.loaders &&
        config.loaders.some(loader => loader.match('premodules') || loader.match('css'))
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

        const rawLoaders = typeof config.loaders === 'string' ? config.loaders : config.loaders.join('!');

        // strip style loader
        const loaders = rawLoaders.replace(/^.*style!/, '');

        cacheMap.set(rules, loaders);
      });
  }

  cacheMap.forEach((loaders, rules) => {
    if (res) return;

    const matched = rules.test.test(resourcePath) &&
      rules.include.some(r => {
        return resourcePath.match(r);
      });

    if (matched) res = loaders;
  });

  return res;
};

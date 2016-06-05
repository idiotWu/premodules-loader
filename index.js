'use strict';

const utils = require('loader-utils');
const parse = require('./lib/parse');
const restore = require('./lib/restore');

module.exports = function loader(source) {
  const query = utils.parseQuery(this.query);

  if (query.parse) {
    return parse.call(this, source);
  }

  if (query.restore) {
    return restore.call(this, source);
  }

  throw new TypeError(`[class-share]: unknown action [${Object.keys(query)}]`);
};

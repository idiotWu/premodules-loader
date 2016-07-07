/**
 * Strip loaders output to className map only
 */

'use strict';

const regex = require('./regex');

module.exports = function stripOutput(source) {
  const matches = source.match(regex.output);

  if (!matches) return 'module.exports = {}';

  return 'module.exports = ' + matches[1];
};


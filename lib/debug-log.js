'use strict';

module.exports = function debugLog() {
  if (process.env.NODE_ENV !== 'DEBUG') return;

  const args = Array.prototype.slice.call(arguments);

  // eslint-disable-next-line no-console
  console.log.apply(console, ['[premodules]:'].concat(args));
};

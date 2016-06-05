'use strict';

const store = {
  processing: 0,
  modules: {},
  pendingDeps: {},
  depsMap: {},
  reset() {
    store.modules = {};
    store.pendingDeps = {};
    store.depsMap = {};
  },
};

module.exports = store;

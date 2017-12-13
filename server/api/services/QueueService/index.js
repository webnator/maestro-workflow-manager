'use strict';

let myQueue;
const Queue = require('./Queue');

module.exports = (deps) => {
  return {
    set(config) {
      myQueue = new Queue(deps, config);
      return myQueue;
    },
    get() { return myQueue }
  }
};

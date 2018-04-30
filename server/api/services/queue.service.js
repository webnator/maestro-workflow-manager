'use strict';

function makeService(deps) {
  const {
    QueueLib,
    config,
    queueRoutes
  } = deps;

  let myQueue = {};
  return {
    async init() {
      myQueue = await QueueLib.create({queueConfig: config.queueConfig, routes: queueRoutes});
    },
    publishHTTP: (...args) => myQueue.publishHTTP(...args),
    get queueManager() {
      return myQueue.queueManager;
    }
  };
}

module.exports = makeService;

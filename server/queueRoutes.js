'use strict';

module.exports = function(queueRouter) {
  require('./api/maestro/queue.router')(queueRouter);
};
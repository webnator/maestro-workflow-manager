'use strict';

// Development specific configuration
// ==================================
module.exports = {
  ip: 'localhost',
  port: 9008,

  mongoSettings: {
    url: 'mongodb://localhost:9503',
    dbName: 'maestro'
  },

  queueConfig: {
    host: 'localhost',
    port: 5672,
    user: 'guest',
    pass: 'guest',
    vhost: '/',
    exchange: 'maestro_exchange',
    errorQueue: 'flow_error',
    errorTopic: 'flow_error',
    reconnectionTime: 2000
  }

};

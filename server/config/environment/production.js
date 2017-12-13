
'use strict';

// Production specific configuration
// ==================================
module.exports = {
  ip: process.env.MAESTRO_IP || 'localhost',
  port: process.env.MAESTRO_PORT || 9000,

  mongoSettings: {
    url: process.env.MAESTRO_MONGO_URL,
    reconnectTime: 5000
  },

  queueConfig: {
    host: process.env.MAESTRO_QUEUE_HOST,
    port: process.env.MAESTRO_QUEUE_PORT,
    user: process.env.MAESTRO_QUEUE_USER,
    pass: process.env.MAESTRO_QUEUE_PW,
    vhost: '/',
    exchange: 'maestro_exchange',
    errorQueue: 'flow_error',
    errorTopic: 'flow_error'
  }

};

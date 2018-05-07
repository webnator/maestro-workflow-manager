'use strict';

// All configurations will extend these options
// ============================================
module.exports = {
  port: process.env.MS_PORT,
  routes: {
    prefix: '/v1/maestro'
  },
  mongoSettings: {
    url: process.env.MONGO_URL,
    dbName: process.env.DB_NAME
  },

  queueConfig: {
    host: process.env.QUEUECONFIG_HOST,
    port: process.env.QUEUECONFIG_PORT,
    user: process.env.QUEUECONFIG_USER,
    pass: process.env.QUEUECONFIG_PASSWORD,
    vhost: process.env.QUEUECONFIG_VHOST,
    exchange: process.env.QUEUECONFIG_EXCHANGE,
    errorQueue: process.env.QUEUECONFIG_ERROR_QUEUE,
    errorTopic: process.env.QUEUECONFIG_ERROR_TOPIC,
    reconnectionTime: parseInt(process.env.QUEUECONFIG_RECONNECTION_TIME),
  },

  collections: {
    templates: process.env.TEMPLATES_COLLECTION,
    processes: process.env.PROCESSES_COLLECTION,
  },

  queues: {
    unhandled_flows: process.env.QUEUE_UNHANDLED_FLOW,
    inconsistent_responses: process.env.QUEUE_BAD_RESPONSE
  },
  topics: {
    inform: process.env.QUEUE_TOPIC_INFORM,
    handle_http: process.env.QUEUE_TOPIC_HTTP,
  }
};

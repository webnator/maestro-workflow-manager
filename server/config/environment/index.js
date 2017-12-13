'use strict';

// All configurations will extend these options
// ============================================
const all = {
  env: process.env.NODE_ENV,
  host: process.env.HOST || process.env.HOSTNAME || 'localhost',
  appName: 'maestro',
  routes: {
    prefix: '/v1/maestro'
  },

  collections: {
    templates: 'maestro_templates',
    logs: 'maestro_logs'
  },

  queues: {
    unhandled_flows: 'maestro.unhandled',
    inconsistent_responses: 'maestro.bad_responses'
  },
  topics: {
    inform: 'maestro.workflow.inform'
  }
};

console.log('Running in', process.env.NODE_ENV, 'mode');

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = Object.assign({},
  all,
  require('./' + process.env.NODE_ENV ) || {});

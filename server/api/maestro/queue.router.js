'use strict';

const container = require('../../boot');
const config = container.resolve('config');

const WorkflowExecutionController = container.resolve('WorkflowExecutionController');

module.exports = function(server) {
  server.route({
    topic: 'maestro.workflow.execute',
    handler: WorkflowExecutionController.executeFlow
  });

  server.route({
    topic: config.topics.inform,
    handler: WorkflowExecutionController.processFlow
  });

  server.route({
    topic: 'maestro.workflow.continue',
    handler: WorkflowExecutionController.continueFlow
  });
};
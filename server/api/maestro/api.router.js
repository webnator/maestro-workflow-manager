'use strict';

const container = require('../../boot');

const WorkflowTemplateController = container.resolve('WorkflowTemplateController');
const WorkflowExecutionController = container.resolve('WorkflowExecutionController');
const WorkflowStatsController = container.resolve('WorkflowStatsController');

module.exports = (server) => {
  // Template management APIs
  server.route({
    method: 'POST',
    path: '/templates',
    config: {
      description: 'Creates a new workflow template'
    },
    handler: WorkflowTemplateController.createTemplate
  });

  server.route({
    method: 'GET',
    path: '/templates',
    config: {
      description: 'Gets all workflow templates'
    },
    handler: WorkflowTemplateController.getTemplates
  });

  server.route({
    method: 'GET',
    path: '/templates/{templateId}',
    config: {
      description: 'Gets a workflow template'
    },
    handler: WorkflowTemplateController.getTemplates
  });

  server.route({
    method: 'DELETE',
    path: '/templates/{templateId}',
    config: {
      description: 'Deletes a workflow template'
    },
    handler: WorkflowTemplateController.deleteTemplate
  });

  server.route({
    method: 'PATCH',
    path: '/templates/{templateId}',
    config: {
      description: 'Updates a workflow template'
    },
    handler: WorkflowTemplateController.updateTemplate
  });

  // Flow Execution APIs
  server.route({
    method: 'POST',
    path: '/executeFlow/{flowId}',
    config: {
      description: 'Starts the execution of a workflow'
    },
    handler: WorkflowExecutionController.executeFlow
  });

  server.route({
    method: 'POST',
    path: '/continueFlow',
    config: {
      description: 'Continues the execution of an errored workflow'
    },
    handler: WorkflowExecutionController.continueFlow
  });

  server.route({
    method: 'GET',
    path: '/flows',
    config: {
      description: 'Retrieves a list of flows'
    },
    handler: WorkflowStatsController.getFlows
  });


};

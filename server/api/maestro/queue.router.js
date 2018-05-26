'use strict';

const container = require('../../boot');

const config = container.resolve('config');
const WorkflowExecutionController = container.resolve('WorkflowExecutionController');
const RequestHandlersController = container.resolve('RequestHandlersController');
const uuid = container.resolve('uuid');
const LogService = container.resolve('LogService');

module.exports = (server) => {
  server.route({
    topic: 'maestro.workflow.execute',
    handler: (request, reply) => WorkflowExecutionController.executeFlow(addLogger(request), reply)
  });

  server.route({
    topic: config.topics.inform,
    handler: (request, reply) => WorkflowExecutionController.informTask(addLogger(request), reply)
  });

  server.route({
    topic: config.topics.handle_http,
    handler: (request, reply) => RequestHandlersController.handleHTTP(addLogger(request), reply)
  });

  server.route({
    topic: 'maestro.workflow.continue',
    handler: (request, reply) => WorkflowExecutionController.continueFlow(addLogger(request), reply)
  });


  // TEST Routes
  server.route({
    topic: 'test-accounts.accounts.get',
    handler: (req, reply) => {
      req = addLogger(req);
      const { logger } = req;
      logger.where(__filename, 'TEST ACCOUNTS').accessing();
      logger.where(__filename, 'TEST ACCOUNTS').info({request: req}, 'Request received');
      const replyObject = { accounts: [
        { provider: 'test-1', number: 123456 },
        { provider: 'test-2', number: 745746 }
      ], result: 'OK'};
      return reply(replyObject).code(200);
    }
  });
};

function addLogger (request) {
  const requestTraceId = request.traceId || uuid.v4();
  request.traceId = requestTraceId;
  request.logger = LogService.child({
    request: {
      payload: request.payload,
      query: request.query,
      headers: request.headers,
      params: request.params,
    },
    traceId: requestTraceId
  });
  return request;
}
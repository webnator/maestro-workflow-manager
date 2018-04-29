'use strict';

const WorflowExecutionSchema = require('./../models/workflowExecution.schema');
const WorflowContinueSchema = require('./../models/continueWorkflow.schema');

function makeWorkflowExecutionController(deps) {
  const {
    ResponsesService,
    ValidationService,
    WorkflowExecutionService,
    workflowResponses
  } = deps;

  return {
    /**
     * Starts the execution of a flow
     * FROM QUEUE - workflow.execute
     * FROM POST - /executeFlow/{flowId}
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async executeFlow(request, reply) {
      const { logger, params, query, headers, payload } = request;
      logger.where(__filename, 'executeFlow').accessing();

      headers['x-flowid'] = headers['x-flowid'] || params.flowId;
      let response;
      try {
        await ValidationService.validateSchema(headers, new WorflowExecutionSchema());
        const executionResponse = await WorkflowExecutionService.executeFlow(logger, {
          templateId: headers['x-flowid'],
          request: { params, query, headers, payload }
        });
        response = ResponsesService.createResponseData(workflowResponses.wf_process_started_ok);

        logger.where(__filename, 'executeFlow').info('Workflow execution started correctly');
        reply(response.body).code(response.statusCode);

        // Async execution
        try {
          await WorkflowExecutionService.processFlow(logger, {request: executionResponse.request});
          logger.where(__filename, 'executeFlow - processing').end();
        } catch (err) {
          logger.where(__filename, 'executeFlow - processing').warn({err}, 'Workflow execution not processed');
        }

      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'executeFlow').warn({err}, 'Workflow execution not started');
        return reply(response.body).code(response.statusCode);
      }
    },

    /**
     * Starts the execution of a flow
     * FROM QUEUE - workflow.inform
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async processFlow(request, reply) {
      const { logger, params, query, headers, payload } = request;
      logger.where(__filename, 'processFlow').accessing();

      let response;
      try {
        await WorkflowExecutionService.processFlow(logger, {
          templateId: headers['x-flowid'],
          data: { params, query, headers, payload }
        });
        response = ResponsesService.createResponseData(workflowResponses.wf_process_informed_ok);
        logger.where(__filename, 'processFlow').info('Workflow inform processed correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'processFlow').warn({err}, 'Workflow inform not processed');
      }
      logger.where(__filename, 'processFlow').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Continues an errored workflow
     * FROM QUEUE - workflow.continue
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async continueFlow(request, reply) {
      const { logger, headers, payload } = request;
      logger.where(__filename, 'continueFlow').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowContinueSchema());
        await WorkflowExecutionService.continueFlow(logger, {payload: templateObject, headers});

        response = ResponsesService.createResponseData(workflowResponses.wf_process_informed_ok);
        logger.where(__filename, 'continueFlow').info('Workflow continued correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'continueFlow').warn({err}, 'Workflow not continued');
      }
      logger.where(__filename, 'continueFlow').end();
      return reply(response.body).code(response.statusCode);
    },

  };
}

module.exports = makeWorkflowExecutionController;


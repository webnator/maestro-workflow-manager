'use strict';

const WorflowExecutionSchema = require('./../models/workflowExecution.schema');
const WorflowContinueSchema = require('./../models/continueWorkflow.schema');

function makeWorkflowExecutionController(deps) {
  const {
    ResponsesService,
    ValidationService,
    WorkflowExecutionService: WorkflowService,
    workflowResponses: responses
  } = deps;

  return {
    /**
     * Starts the execution of a flow
     * FROM QUEUE - workflow.execute
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async executeFlow(request, reply) {
      const { logger, params, query, headers, payload } = request;
      logger.method(__filename, 'executeFlow').accessing();

      headers['x-flowid'] = headers['x-flowid'] || params.flowId;
      let response;
      try {
        await ValidationService.validateSchema(headers, new WorflowExecutionSchema());
        const executionResponse = await WorkflowService.executeFlow(logger, {
          templateId: headers['x-flowid'],
          request: { params, query, headers, payload }
        });
        response = ResponsesService.createResponseData(responses.wf_process_started_ok);
        logger.method(__filename, 'executeFlow').success('OK');
        reply(response.body).code(response.statusCode);

        // Async execution
        try {
          await WorkflowService.processFlow(logger, {request: executionResponse.request});
          logger.method(__filename, 'executeFlow - processing').success('OK');
        } catch (err) {
          logger.method(__filename, 'executeFlow - processing').error();
        }

      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'executeFlow').fail(err);
        reply(response.body).code(response.statusCode);
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
      const { logger, headers, payload } = request;
      logger.method(__filename, 'processFlow').accessing();

      let response;
      try {
        await WorkflowService.processFlow(logger, {
          templateId: headers['x-flowid'],
          data: { params, query, headers, payload }
        });
        response = ResponsesService.createResponseData(responses.wf_process_informed_ok);
        logger.method(__filename, 'processFlow').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'processFlow').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
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
      logger.method(__filename, 'continueFlow').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowContinueSchema());
        await WorkflowService.continueFlow(logger, {payload: templateObject, headers});
        response = ResponsesService.createResponseData(responses.wf_process_informed_ok);
        logger.method(__filename, 'continueFlow').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'continueFlow').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

  };
}

module.exports = makeWorkflowExecutionController;


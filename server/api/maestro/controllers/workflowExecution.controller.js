'use strict';

const WorflowExecutionSchema = require('./../models/workflowExecution.schema');
const WorflowContinueSchema = require('./../models/continueWorkflow.schema');

function makeWorkflowExecutionController(deps) {
  const {
    ResponsesService,
    ValidationService,
    LogService,
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
        await WorkflowService.executeFlow(logger, {
          templateId: headers['x-flowid'],
          data: { params, query, headers, payload }
        });
        response = ResponsesService.createResponseData(responses.wf_process_started_ok);
        logger.method(__filename, 'executeFlow').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'executeFlow').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }

      try {
        await WorkflowService.processFlow(logger, {});
        logger.method(__filename, 'executeFlow - processing').success('OK');
      } catch (err) {
        logger.method(__filename, 'executeFlow - processing').error();
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
    processFlow(request, reply) {
      let data = {
        logData: LogService.logData(request),
        headers: request.headers,
        payload: request.payload
      };

      LogService.info(data.logData, 'WorflowExecutionController processFlow | Accessing');

      WorkflowService.processFlow(data)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_process_informed_ok);
          LogService.info(data.logData, 'WorflowExecutionController processFlow | OK');
          reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowExecutionController processFlow | KO', response.body);
          reply(response.body).code(response.statusCode);
        });
    },

    /**
     * Continues an errored workflow
     * FROM QUEUE - workflow.continue
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    continueFlow(request, reply) {
      let data = {
        logData: LogService.logData(request),
        payload: request.payload,
        schema: new WorflowContinueSchema()
      };

      LogService.info(data.logData, 'WorflowExecutionController processFlow | Accessing');

      ValidationService.validateSchema(data)
        .then(WorkflowService.continueFlow)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_process_informed_ok);
          LogService.info(data.logData, 'WorflowExecutionController processFlow | OK');
          reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowExecutionController processFlow | KO', response.body);
          reply(response.body).code(response.statusCode);
        });
    },

  };
}

module.exports = makeWorkflowExecutionController;


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

  function checkExecutionPayload(req) {
    let validationPayload = {
      payload: req,
      schema: new WorflowExecutionSchema()
    };
    return ValidationService.validateSchema(validationPayload);
  }

  return {
    /**
     * Starts the execution of a flow
     * FROM QUEUE - workflow.execute
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    executeFlow(request, reply) {
      let data = {
        logData: LogService.logData(request),
        params: request.params,
        query: request.query,
        headers: request.headers,
        payload: request.payload
      };

      request.headers['x-flowid'] = request.headers['x-flowid'] || data.params.flowId;

      LogService.info(data.logData, 'WorflowExecutionController executeFlow | Accessing');

      checkExecutionPayload(data)
        .then(() => WorkflowService.executeFlow(data))
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_process_started_ok);
          LogService.info(data.logData, 'WorflowExecutionController executeFlow | OK');
          reply(response.body).code(response.statusCode);

          return WorkflowService.processFlow(data).then(() => {
            LogService.info(data.logData, 'WorflowExecutionController processFlow | OK');
          }).catch((err) => {
            LogService.info(data.logData, 'WorflowExecutionController processFlow | KO', err);
          });
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowExecutionController executeFlow | KO', response.body);
          reply(response.body).code(response.statusCode);
        });
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


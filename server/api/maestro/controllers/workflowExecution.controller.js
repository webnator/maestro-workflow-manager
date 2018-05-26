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
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async executeFlow(request, reply) {
      const { logger, params, headers, payload, traceId } = request;
      logger.where(__filename, 'executeFlow').accessing();

      headers['x-flowid'] = headers['x-flowid'] || params.flowId;
      let response;
      try {
        await ValidationService.validateSchema(headers, new WorflowExecutionSchema());
        const processId = await WorkflowExecutionService.executeFlow(logger, {
          templateId: headers['x-flowid'],
          request: { payload, traceId }
        });
        response = ResponsesService.createResponseData(workflowResponses.wf_process_started_ok);

        logger.where(__filename, 'executeFlow').info('Workflow execution started correctly');
        reply(response.body).code(response.statusCode);

        // Async execution
        try {
          await WorkflowExecutionService.executeNextProcessTask(logger, processId, payload);
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
     * Informs the execution of a task in a flow
     * FROM QUEUE - workflow.inform
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async informTask(request, reply) {
      const { logger, headers, payload, traceId } = request;
      logger.where(__filename, 'processFlow').accessing();

      let response;
      try {
        const processId = headers['x-flowprocessid'];
        const taskId = headers['x-flowtaskid'];
        await WorkflowExecutionService.handleFinishedTask(logger, processId, taskId, {headers, payload, traceId });

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
     * Continues a workflow
     * FROM QUEUE - workflow.continue
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async continueFlow(request, reply) {
      const { logger, payload } = request;
      logger.where(__filename, 'continueFlow').accessing();

      let response;
      try {
        await WorkflowExecutionService.executeNextProcessTask(logger, payload.processUuid);

        response = ResponsesService.createResponseData(workflowResponses.wf_process_informed_ok);
        logger.where(__filename, 'continueFlow').info('Workflow continued correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'continueFlow').warn({err}, 'Workflow not continued');
      }
      logger.where(__filename, 'continueFlow').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Resumes an errored workflow
     * FROM POST - /resumeFlow
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async resumeErroredFlow(request, reply) {
      const { logger, payload } = request;
      logger.where(__filename, 'continueFlow').accessing();

      let response;
      try {
        await ValidationService.validateSchema(payload, new WorflowContinueSchema());
        await WorkflowExecutionService.resumeErroredFlow(logger, { processUuid: payload.processUuid, processName: payload.processName});

        response = ResponsesService.createResponseData(workflowResponses.wf_process_informed_ok);
        logger.where(__filename, 'continueFlow').info('Workflow continued correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'continueFlow').warn({err}, 'Workflow not continued');
      }
      logger.where(__filename, 'continueFlow').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Retrieves all the started processes from the DB filtered by the query params
     * FROM GET - /flows
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async getFlows(request, reply) {
      const { logger, query } = request;

      logger.where(__filename, 'getFlows').accessing();
      let response;
      try {
        const flows = await WorkflowExecutionService.getStartedProcesses(logger, { query });

        response = ResponsesService.createResponseData(workflowResponses.wf_retrieved_ok, flows);
        logger.where(__filename, 'getTemplates').info('Flows stats retrieved correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'getFlows').warn({err}, 'Flows stats not retrieved');
      }
      logger.where(__filename, 'getFlows').end();
      return reply(response.body).code(response.statusCode);

    },

  };
}

module.exports = makeWorkflowExecutionController;


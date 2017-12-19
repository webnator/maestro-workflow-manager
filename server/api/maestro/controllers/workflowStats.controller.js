'use strict';

function makeWorkflowStatsController(deps) {
  const {
    ResponsesService,
    LogService,
    WorkflowStatsService: WorkflowService,
    workflowResponses: responses
  } = deps;

  return {
    /**
     * Retrieves
     * FROM GET - /flows
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async getFlows(request, reply) {
      const { logger, query } = request;

      logger.method(__filename, 'getFlows').accessing();
      let response;
      try {
        const flows = await WorkflowService.getFlows(logger, { query });
        response = ResponsesService.createResponseData(responses.wf_retrieved_ok, flows);
        logger.method(__filename, 'getTemplates').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'getFlows').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

  };
}

module.exports = makeWorkflowStatsController;


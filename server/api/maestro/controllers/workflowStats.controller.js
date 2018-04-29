'use strict';

function makeWorkflowStatsController(deps) {
  const {
    ResponsesService,
    WorkflowStatsService,
    workflowResponses
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

      logger.where(__filename, 'getFlows').accessing();
      let response;
      try {
        const flows = await WorkflowStatsService.getFlows(logger, { query });

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

module.exports = makeWorkflowStatsController;


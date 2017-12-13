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
    getFlows(request, reply) {
      let data = {
        logData: LogService.logData(request),
        query: request.query
      };

      LogService.info(data.logData, 'WorflowStatsController getFlows | Accessing');

      WorkflowService.getFlows(data)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_retrieved_ok, data.flowsResponse);
          LogService.info(data.logData, 'WorflowStatsController getFlows | OK');
          reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowStatsController getFlows | KO', response.body);
          reply(response.body).code(response.statusCode);
        });
    },

  };
}

module.exports = makeWorkflowStatsController;


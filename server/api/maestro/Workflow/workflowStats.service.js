'use strict';



function makeWorkflowService(deps) {
  const {
    LogService,
    workflowStatsFactory
  } = deps;

  return {
    /**
     * Starts the execution of a workflow
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    async getFlows(data) {
      LogService.info(data.logData, 'WFStatsService getFlows | Accessing');

      data.processes = workflowStatsFactory({params: data.query});

      try {
        await data.processes.fetchProcesses(data);

        data.flowsResponse = data.processes.getProcessesResponse();

        LogService.info(data.logData, 'WFStatsService getFlows | OK');
        return Promise.resolve(data);
      } catch (err) {
        LogService.info(data.logData, 'WFStatsService getFlows | KO Error');
        return Promise.reject(err);
      }

    },

  };
}

module.exports = makeWorkflowService;

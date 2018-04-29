'use strict';

function makeWorkflowService(deps) {
  const {
    workflowStatsFactory
  } = deps;

  return {
    /**
     * Starts the execution of a workflow
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {Object} query - The request query object
     */
    async getFlows(logger, { query }) {
      logger.where(__filename, 'getFlows').accessing();

      const process = workflowStatsFactory({logger, params: query});
      try {
        await process.fetchProcesses();
        logger.where(__filename, 'getFlows').end();
        return process.getProcessesResponse();
      } catch (err) {
        throw err;
      }

    },

  };
}

module.exports = makeWorkflowService;

'use strict';

class WorkflowStatsEntity {
  constructor(deps, opts) {
    const {
      RepositoryFactory,
      workflowResponses: responses,
      REPOSITORY_NAME_STATS
    } = deps;
    opts = Object.assign(opts, {});

    this.repository = RepositoryFactory.getRepository(REPOSITORY_NAME_STATS);
    this.logger = opts.logger;
    this.responses = responses;
    this.params = opts.params;
  }

  setProcesses(dbObject) {
    let params = this.params;
    this.processes = dbObject.filter((process) => {
      if (params.status) {
        let statusList = params.status.split(',');
        return statusList.includes(process.status[process.status.length - 1].status);
      } else {
        return true;
      }
    });
  }

  getProcessesResponse() {
    return this.processes;
  }

  /**
   * Fetches a list of processes depending on the received parameters
   */
  async fetchProcesses() {
    this.logger.where(__filename, 'fetchProcesses').accessing();

    const DBObject = { params: this.params };
    try {
      const { result } = await this.repository.fetch(this.logger, DBObject);
      this.setProcesses(result);
      this.logger.where(__filename, 'fetchProcesses').end();
    } catch (err) {
      this.logger.where(__filename, 'fetchProcesses').error('KO from DDBB', err);
      throw this.responses.ddbb_error;
    }
  }

}

module.exports = WorkflowStatsEntity;

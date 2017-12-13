'use strict';

class WorkflowStatsEntity {
  constructor(deps, opts) {
    const {
      LogService,
      RepositoryFactory,
      workflowResponses: responses,
      REPOSITORY_NAME_STATS
    } = deps;
    opts = Object.assign(opts, {});

    this.repository = RepositoryFactory.getRepository(REPOSITORY_NAME_STATS);
    this.LogService = LogService;
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
   * @param data
   * @returns {Promise}
   */
  async fetchProcesses(data) {
    return new Promise((resolve, reject) => {
      this.LogService.info(data.logData, 'WorkflowStatsEntity fetchProcesses | Accessing');

      let DBObject = {
        params: this.params
      };
      this.repository.fetch(DBObject, data.logData).then((res) => {
        this.setProcesses(res.dbData.result);
        this.LogService.info(data.logData, 'WorkflowStatsEntity fetchProcesses | OK');
        return resolve();
      })
      .catch((err) => {
        this.LogService.error(data.logData, 'WorkflowStatsEntity fetchProcesses | KO from DDBB', err);
        return reject(this.responses.ddbb_error);
      });
    });
  }

}

module.exports = WorkflowStatsEntity;

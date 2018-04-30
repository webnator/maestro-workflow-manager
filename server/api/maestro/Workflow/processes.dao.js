'use strict';

const DBService = require('./../../services/DbService');

class ProcessesDAO extends DBService {
  constructor(deps) {
    super();
    const {
      config
    } = deps;
    this.collectionName = config.collections.processes;
  }

  /**
   * Returns the collection name from the repository
   * @public
   * @return {string} result - The collection name
   */
  getCollectionName() {
    return this.collectionName;
  }

  getResponses() {
    return DBService.getResponses();
  }

  /**
   * Saves the template into the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {Object} process - The process object to store
   */
  save(logger, process) {
    logger.where(__filename, 'save').accessing();
    const DAOData = {
      entity: process
    };
    return super.insert(DAOData);
  }

  /**
   * Updates a process log in the collection
   * @param {Object} logger - The logger instance
   * @param {String} processUuid - The process id to be updated
   * @param {Object} processObject - The process object to update
   */
  updateProcess(logger, processUuid, processObject) {
    logger.where(__filename, 'updateProcess').accessing();
    const DAOData = {
      query: { processUuid },
      entity: processObject
    };
    return super.update(DAOData);
  }

  /**
   * Retrieves the process from the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {String} processUuid - The process uuid to fetch
   */
  async fetch(logger, processUuid) {
    logger.where(__filename, 'fetch').accessing();
    const DAOData = {
      query: { processUuid },
      options: {projection: {_id: 0}}
    };
    const res = await super.findOne(DAOData);
    return res.result;
  }

  /**
   * Retrieves the templates from the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {*} [from] - Anything that can be converted into a Date
   * @param {*} [to] - Anything that can be converted into a Date
   * @param {String} [processName] - The name of the process to fetch
   * @param {String} [processUuid] - The exact uuid of the process to fetch
   */
  async getCompletedProcesses(logger, { from, to, processName, processUuid } = {}) {
    logger.where(__filename, 'getCompletedProcesses').accessing();
    const DAOData = {
      query: {},
      options: {projection: {_id: 0}}
    };

    if (from) {
      DAOData.query.startDate = { $gte: new Date(from) };
    }
    if (to) {
      DAOData.query.startDate = { $lte: new Date(to) };
    }
    if (processName) {
      DAOData.query.flowName = processName;
    }
    if (processUuid) {
      DAOData.query.processUuid = processUuid;
    }

    const res = await super.find(DAOData);
    logger.where(__filename, 'getCompletedProcesses').end();
    return res.result;
  }

}

module.exports = ProcessesDAO;

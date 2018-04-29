'use strict';

const DBService = require('./../../services/DbService');

class LogsDAO extends DBService {
  constructor(deps) {
    super();
    const {
      config
    } = deps;
    this.collectionName = config.collections.logs;
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
   * @param {Object} DBObject - The container object
   */
  save(logger, DBObject) {
    logger.where(__filename, 'save').accessing();
    const DAOData = { entity: DBObject.logObject };
    return super.insert(DAOData);
  }

  /**
   * Updates a process log in the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  updateLog(logger, DBObject) {
    logger.where(__filename, 'updateLog').accessing();
    const DAOData = {
      query: {
        processUuid: DBObject.logObject.processUuid
      },
      entity: DBObject.logObject
    };
    return super.update(DAOData);
  }

  /**
   * Retrieves the process from the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  fetch(logger, DBObject) {
    logger.where(__filename, 'fetch').accessing();
    const DAOData = {
      query: {
        processUuid: DBObject.processUuid
      }
    };
    return super.findOne(DAOData);
  }

}

module.exports = LogsDAO;

'use strict';

const config = require('./../../../config/environment');
const DBService = require('./../../services/DbService');

class LogsDAO extends DBService {

  constructor({LogService}) {
    super();
    this.LogService = LogService;
  }

  /**
   * Returns the collection name from the repository
   * @public
   * @return {string} result - The collection name
   */
  getCollectionName() {
    return config.collections.logs;
  }

  getResponses() {
    return DBService.getResponses();
  }

  /**
   * Saves the template into the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  save(DBObject, logData) {
    this.LogService.info(logData, 'LogsDAO save | Accessing');
    let DAOData = {
      dbData: {
        entity: DBObject.logObject
      },
      logData: logData
    };
    return super.insert(DAOData);
  }

  /**
   * Updates a process log in the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  updateLog(DBObject, logData) {
    this.LogService.info(logData, 'LogsDAO update | Accessing');
    let DAOData = {
      dbData: {
        query: {
          processUuid: DBObject.logObject.processUuid
        },
        entity: DBObject.logObject
      },
      logData: logData
    };
    return super.update(DAOData);
  }

  /**
   * Retrieves the process from the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  fetch(DBObject, logData) {
    this.LogService.info(logData, 'LogsDAO fetch | Accessing');
    let DAOData = {
      dbData: {
        query: {
          processUuid: DBObject.processUuid
        }
      },
      logData: logData
    };
    return super.findOne(DAOData);
  }




}

module.exports = LogsDAO;

'use strict';

const config = require('./../../../config/environment');
const DBService = require('./../../services/DbService');

class StatsDAO extends DBService {

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
   * Retrieves the templates from the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  fetch(DBObject, logData) {
    this.LogService.info(logData, 'StatsDAO fetch | Accessing');
    let DAOData = {
      dbData: {
        query: {}
      },
      logData: logData
    };

    if (DBObject.params) {
      if (DBObject.params.from) {
        DAOData.dbData.query.startDate = { $gte: new Date(DBObject.params.from) };
      }
      if (DBObject.params.to) {
        DAOData.dbData.query.startDate = { $lte: new Date(DBObject.params.to) };
      }
      if (DBObject.params.process) {
        DAOData.dbData.query.flowName = DBObject.params.process;
      }
    }

    return super.find(DAOData);

  }


}

module.exports = StatsDAO;

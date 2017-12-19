'use strict';

const config = require('./../../../config/environment');
const DBService = require('./../../services/DbService');

class StatsDAO extends DBService {

  constructor() {
    super();
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
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  fetch(logger, DBObject) {
    logger.method(__filename, 'fetch').accessing();
    const DAOData = {
      query: {}
    };

    if (DBObject.params) {
      if (DBObject.params.from) {
        DAOData.query.startDate = { $gte: new Date(DBObject.params.from) };
      }
      if (DBObject.params.to) {
        DAOData.query.startDate = { $lte: new Date(DBObject.params.to) };
      }
      if (DBObject.params.process) {
        DAOData.query.flowName = DBObject.params.process;
      }
    }

    return super.find(DAOData);

  }


}

module.exports = StatsDAO;

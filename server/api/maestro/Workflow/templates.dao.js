'use strict';

const config = require('./../../../config/environment');
const DBService = require('./../../services/DbService');

class TemplatesDAO extends DBService {

  constructor() {
    super();
  }

  /**
   * Returns the collection name from the repository
   * @public
   * @return {string} result - The collection name
   */
  getCollectionName() {
    return config.collections.templates;
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
    let DAOData = {
      dbData: {
        entity: DBObject.templateObject
      },
      logData: logData
    };
    return super.insert(DAOData);
  }

  /**
   * Updates a template in the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  update(DBObject, logData) {
    let DAOData = {
      dbData: {
        query: {
          name: DBObject.templateId
        },
        entity: DBObject.templateObject
      },
      logData: logData
    };
    return super.update(DAOData);
  }

  /**
   * Retrieves the templates from the collection
   * @publicç
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  fetch(logger, DBObject) {
    logger.method(__filename, 'fetch').success();
    const DAOData = {
      query: {}
    };

    if (DBObject.templateId) {
      DAOData.query.name = DBObject.templateId;
      return super.findOne(DAOData);
    } else {
      return super.find(DAOData);
    }
  }

  /**
   * Deletes a template from the collection
   * @public
   * @param {Object} DBObject - The container object
   * @param {Object} logData - The log object
   * @return {Promise}
   */
  remove(DBObject, logData) {
    let DAOData = {
      dbData: {
        query: {
          name: DBObject.templateId
        }
      },
      logData: logData
    };

    return super.remove(DAOData);
  }

}

module.exports = TemplatesDAO;

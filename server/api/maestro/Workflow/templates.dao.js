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
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  save(logger, DBObject) {
    logger.method(__filename, 'save').accessing();
    const DAOData = {
      entity: DBObject.templateObject
    };
    return super.insert(DAOData);
  }

  /**
   * Updates a template in the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  updateTemplate(logger, DBObject) {
    logger.method(__filename, 'updateTemplate').accessing();

    const DAOData = {
      query: {
        name: DBObject.templateId
      },
      entity: DBObject.templateObject
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
    logger.method(__filename, 'fetch').accessing();
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
   * @param {Object} logger - The logger instance
   * @param {Object} DBObject - The container object
   */
  removeTemplate(logger, DBObject) {
    logger.method(__filename, 'removeTemplate').accessing();
    const DAOData = {
      query: {
        name: DBObject.templateId
      }
    };

    return super.remove(DAOData);
  }

}

module.exports = TemplatesDAO;

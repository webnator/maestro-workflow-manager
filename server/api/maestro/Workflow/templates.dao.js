'use strict';

const DBService = require('./../../services/DbService');

class TemplatesDAO extends DBService {

  constructor(deps) {
    super();
    const {
      config
    } = deps;
    this.collectionName = config.collections.templates;
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
   * @param {Object} template - The template object to store in the DB
   */
  async save(logger, {template}) {
    logger.where(__filename, 'save').accessing();
    const DAOData = {
      entity: template
    };
    await super.insert(DAOData);
  }

  /**
   * Updates a template in the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {Object} template - The new template object to update in the DB
   * @param {String} templateId - The template if to update
   */
  async updateTemplate(logger, {templateId, template}) {
    logger.where(__filename, 'updateTemplate').accessing();

    const DAOData = {
      query: {
        name: templateId
      },
      entity: template
    };
    const result = await super.update(DAOData);
    return result.response && result.response.result && result.response.result.n && result.response.result.n > 0;
  }

  /**
   * Retrieves the templates from the collection
   * @publicç
   * @param {Object} logger - The logger instance
   * @param {String} [templateId] - The template id to retrieve. If not provided retrieves all
   */
  async fetch(logger, templateId) {
    logger.where(__filename, 'fetch').accessing();
    const DAOData = {
      query: {},
      options: {projection: {_id: 0}}
    };
    let res;
    if (templateId) {
      DAOData.query.name = templateId;
      res = await super.findOne(DAOData);
    } else {
      res = await super.find(DAOData);
    }
    return res.result;
  }

  /**
   * Deletes a template from the collection
   * @public
   * @param {Object} logger - The logger instance
   * @param {String} templateId - The template id to delete
   */
  async removeTemplate(logger, templateId) {
    logger.where(__filename, 'removeTemplate').accessing();
    const DAOData = {
      query: {
        name: templateId
      }
    };

    await super.remove(DAOData);
  }

}

module.exports = TemplatesDAO;

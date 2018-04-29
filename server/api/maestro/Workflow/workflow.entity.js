'use strict';

const templateResponseModel = require('./models/template.response.model');

class WorkflowEntity {
  constructor(deps, opts) {
    const {
      RepositoryFactory,
      workflowResponses: responses,
      REPOSITORY_NAME_TEMPLATES
    } = deps;
    opts = Object.assign(opts, {});

    this.repository = RepositoryFactory.getRepository(REPOSITORY_NAME_TEMPLATES);
    this.logger = opts.logger;
    this.responses = responses;

    this.setTemplateObject(opts.templateObject);
    this.setTemplateId(opts.templateId);
  }

  setTemplateObject(templateObject) {
    this.templateObject = templateObject;
  }
  setTemplateId(templateId) {
    this.templateId = templateId;
  }

  getTemplateObject() {
    return this.templateObject;
  }
  getTemplateId() {
    return this.templateId;
  }
  getTemplatesResult() {
    return templateResponseModel(this.getTemplateObject());
  }

  /**
   * Saves the templateObject to the DDBB
   * @returns {Promise}
   */
  async saveToDDBB() {
    this.logger.where(__filename, 'saveToDDBB').accessing();

    const DBObject = { templateObject: this.getTemplateObject() };
    try {
      await this.repository.save(this.logger, DBObject);
      this.logger.where(__filename, 'saveToDDBB').end();
    } catch (err) {
      this.logger.where(__filename, 'saveToDDBB').error('KO from DDBB', err);
      throw this.responses.ddbb_error;
    }
  }

  /**
   * Updates the templateObject to the DDBB
   * @returns {Promise}
   */
  async updateInDDBB() {
    this.logger.where(__filename, 'updateInDDBB').accessing();
    const DBObject = {
      templateObject: this.getTemplateObject(),
      templateId: this.getTemplateId()
    };

    try {
      const dbResponse = await this.repository.updateTemplate(this.logger, DBObject);
      if (dbResponse.response && dbResponse.response.result && dbResponse.response.result.n && dbResponse.response.result.n > 0) {
        this.logger.where(__filename, 'updateInDDBB').end();
      } else {
        this.logger.where(__filename, 'updateInDDBB').error('Nothing to update');
        throw this.responses.no_templates_found_ko;
      }
    } catch (err) {
      this.logger.where(__filename, 'updateInDDBB').error('KO from DDBB', err);
      throw err === this.responses.no_templates_found_ko ? err : this.responses.ddbb_error;
    }
  }

  /**
   * Fetches a template or list of templates from the DDBB
   * @param {String} templateId - The id of the template to fetch
   * @returns {Promise}
   */
  async fetchTemplate({templateId}) {
    this.logger.where(__filename, 'fetchTemplate').accessing();

    const DBObject = { templateId };
    try {
      const { result } = await this.repository.fetch(this.logger, DBObject);
      this.setTemplateObject(result);
      this.logger.where(__filename, 'fetchTemplate').end();
      return this.getTemplateObject();
    } catch (err) {
      this.logger.where(__filename, 'fetchTemplate').error('KO from DDBB', err);
      throw this.responses.ddbb_error;
    }
  }

  /**
   * Deletes a template from the DDBB
   * @param data
   * @returns {Promise}
   */
  async deleteTemplate(data) {
    this.logger.where(__filename, 'deleteTemplate').accessing();

    const DBObject = { templateId: this.getTemplateId() };
    try {
      await this.repository.removeTemplate(this.logger, DBObject);
      this.logger.where(__filename, 'deleteTemplate').end();
    } catch (err) {
      this.logger.where(__filename, 'deleteTemplate').error('KO from DDBB', err);
      throw this.responses.ddbb_error;
    }
  }



}

module.exports = WorkflowEntity;

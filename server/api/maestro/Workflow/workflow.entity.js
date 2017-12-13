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
   * @param data
   * @returns {Promise}
   */
  saveToDDBB(data) {
    return new Promise((resolve, reject) => {
      this.logger.method(__filename, 'saveToDDBB').accessing();

      let DBObject = {
        templateObject: this.getTemplateObject()
      };
      this.repository.save(DBObject, data.logData)
        .then(() => {
          this.logger.method(__filename, 'saveToDDBB').info(data.logData, 'WorkflowEntity saveToDDBB | OK');
          return resolve();
        })
        .catch((err) => {
          this.logger.method(__filename, 'saveToDDBB').error(data.logData, 'WorkflowEntity saveToDDBB | KO from DDBB', err);
          return reject(this.responses.ddbb_error);
        });
    });
  }

  /**
   * Updates the templateObject to the DDBB
   * @param data
   * @returns {Promise}
   */
  updateInDDBB(data) {
    return new Promise((resolve, reject) => {
      this.logger.method(__filename, 'updateInDDBB').accessing();

      let DBObject = {
        templateObject: this.getTemplateObject(),
        templateId: this.getTemplateId()
      };
      this.repository.update(DBObject, data.logData).then((res) => {
        if (res.dbData.response && res.dbData.response.result && res.dbData.response.result.n && res.dbData.response.result.n > 0) {
          this.logger.method(__filename, 'updateInDDBB').info(data.logData, 'WorkflowEntity updateInDDBB | OK');
          return resolve();
        } else {
          this.logger.method(__filename, 'updateInDDBB').info(data.logData, 'WorkflowEntity updateInDDBB | Nothing to update');
          return reject(this.responses.no_templates_found_ko);
        }

      })
      .catch((err) => {
        this.logger.method(__filename, 'updateInDDBB').error(data.logData, 'WorkflowEntity updateInDDBB | KO from DDBB', err);
        return reject(this.responses.ddbb_error);
      });
    });
  }

  /**
   * Fetches a template or list of templates from the DDBB
   * @param {String} templateId - The id of the template to fetch
   * @returns {Promise}
   */
  async fetchTemplate({templateId}) {
    this.logger.method(__filename, 'fetchTemplate').accessing();

    const DBObject = { templateId };

    try {
      const { result } = await this.repository.fetch(this.logger, DBObject);
      this.setTemplateObject(result);
      this.logger.method(__filename, 'fetchTemplate').success();
      return this.getTemplateObject();
    } catch (err) {
      this.logger.method(__filename, 'fetchTemplate').error('KO from DDBB', err);
      throw this.responses.ddbb_error;
    }

  }

  /**
   * Deletes a template from the DDBB
   * @param data
   * @returns {Promise}
   */
  deleteTemplate(data) {
    return new Promise((resolve, reject) => {
      this.logger.method(__filename, 'deleteTemplate').accessing();

      let DBObject = {
        templateId: this.getTemplateId()
      };
      this.repository.remove(DBObject, data.logData).then((res) => {
        this.logger.method(__filename, 'deleteTemplate').info(data.logData, 'WorkflowEntity deleteTemplate | OK');
        return resolve();
      })
        .catch((err) => {
          this.logger.method(__filename, 'deleteTemplate').error(data.logData, 'WorkflowEntity deleteTemplate | KO from DDBB', err);
          return reject(this.responses.ddbb_error);
        });
    });
  }



}

module.exports = WorkflowEntity;

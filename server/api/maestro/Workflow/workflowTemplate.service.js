'use strict';

function makeWorkflowService(deps) {
  const {
    LogService,
    workflowEntityFactory,
    workflowResponses: responses
  } = deps;

  return {
    /**
     * Creates a new workflow template into the DDBB
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    createTemplate(data) {
      return new Promise(function(resolve, reject) {
        LogService.info(data.logData, 'WFService createTemplate | Accessing');
        data.workflowTemplate = workflowEntityFactory({ templateObject: data.payload });

        data.workflowTemplate.saveToDDBB(data).then(() => {
          LogService.info(data.logData, 'WFService createTemplate | OK');
          return resolve(data);
        }).catch((err) => {
          LogService.error(data.logData, 'WFService createTemplate | KO', err);
          return reject(err);
        });
      });
    },

    /**
     * Updates a workflow template into the DDBB
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    updateTemplate(data) {
      return new Promise(function(resolve, reject) {
        LogService.info(data.logData, 'WFService updateTemplate | Accessing');
        data.workflowTemplate = workflowEntityFactory({
          templateObject: data.payload,
          templateId: data.params.templateId
        });

        return data.workflowTemplate.updateInDDBB(data).then(() => {
          LogService.info(data.logData, 'WFService updateTemplate | OK');
          return resolve(data);
        }).catch((err) => {
          LogService.error(data.logData, 'WFService updateTemplate | KO', err);
          return reject(err);
        });
      });
    },

    /**
     * Returns the workflow templates
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {String} templateId - The id of the workflow template we want to retrieve
     * @returns {Promise}
     */
    async getTemplates(logger, { templateId }) {
      logger.method(__filename, 'getTemplates').accessing();

      const workflowTemplate = workflowEntityFactory({ logger });
      try {
        const template = await workflowTemplate.fetchTemplate({templateId});
        if (!template) {
          logger.method(__filename, 'getTemplates').fail('No templates');
          throw responses.no_templates_found_ko;
        } else {
          logger.method(__filename, 'getTemplates').success();
          return template;
        }
      } catch (err) {
        throw err;
      }
    },

    /**
     * Deletes a workflow template
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    deleteTemplate(data) {
      return new Promise(function(resolve, reject) {
        LogService.info(data.logData, 'WFService deleteTemplate | Accessing');
        data.workflowTemplate = workflowEntityFactory({ templateId: data.params.templateId });

        return data.workflowTemplate.deleteTemplate(data).then(() => {
          LogService.info(data.logData, 'WFService deleteTemplate | OK');
          return resolve(data);
        }).catch((err) => {
          LogService.error(data.logData, 'WFService deleteTemplate | KO', err);
          return reject(err);
        });
      });
    }
  };
}

module.exports = makeWorkflowService;

'use strict';

function makeWorkflowService(deps) {
  const {
    workflowEntityFactory,
    workflowResponses: responses
  } = deps;

  return {
    /**
     * Creates a new workflow template into the DDBB
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {Object} templateObject - The template object to create
     */
    async createTemplate(logger, {templateObject}) {
      logger.method(__filename, 'createTemplate').accessing();

      const workflowTemplate = workflowEntityFactory({ logger, templateObject });
      try {
        await workflowTemplate.saveToDDBB();
        logger.method(__filename, 'createTemplate').success();
      } catch (err) {
        throw err;
      }
    },

    /**
     * Updates a workflow template into the DDBB
     * @public
     * @param {Object} logger - The log object
     * @param {Object} templateObject - The new template object to set
     * @param {Object} templateId - The id of the template to update
     */
    async updateTemplate(logger, {templateObject, templateId}) {
      logger.method(__filename, 'updateTemplate').accessing();

      const workflowTemplate = workflowEntityFactory({ logger, templateObject, templateId });
      try {
        await workflowTemplate.updateInDDBB();
        logger.method(__filename, 'updateTemplate').success();
      } catch (err) {
        throw err;
      }
    },

    /**
     * Returns the workflow templates
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {String} templateId - The id of the workflow template we want to retrieve
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
     * @param {Object} logger - The log object
     * @param {Object} templateId - The id of the template to update
     */
    async deleteTemplate(logger, {templateId}) {
      logger.method(__filename, 'deleteTemplate').accessing();

      const workflowTemplate = workflowEntityFactory({ logger, templateId });
      try {
        await workflowTemplate.deleteTemplate();
        logger.method(__filename, 'createTemplate').success();
      } catch (err) {
        throw err;
      }
    }
  };
}

module.exports = makeWorkflowService;

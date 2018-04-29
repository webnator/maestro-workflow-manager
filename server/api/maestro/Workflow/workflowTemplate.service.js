'use strict';

function makeWorkflowService(deps) {
  const {
    workflowResponses,
    RepositoryFactory,
    REPOSITORY_NAME_TEMPLATES
  } = deps;
  const templateRepository = RepositoryFactory.getRepository(REPOSITORY_NAME_TEMPLATES);

  return {
    /**
     * Creates a new workflow template into the DDBB
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {Object} templateObject - The template object to create
     */
    async createTemplate(logger, {templateObject}) {
      logger.where(__filename, 'createTemplate').accessing();

      await templateRepository.save(logger, { template: templateObject });

      logger.where(__filename, 'createTemplate').end();
    },

    /**
     * Updates a workflow template into the DDBB
     * @public
     * @param {Object} logger - The log object
     * @param {Object} templateObject - The new template object to set
     * @param {Object} templateId - The id of the template to update
     */
    async updateTemplate(logger, {templateObject, templateId}) {
      logger.where(__filename, 'updateTemplate').accessing();

      const updated = await templateRepository.updateTemplate(logger, { template: templateObject, templateId });
      if (!updated) {
        logger.where(__filename, 'updateTemplate').warn('Template id to be updated was not found');
        throw workflowResponses.no_templates_found_ko;
      }
      logger.where(__filename, 'updateTemplate').end();
    },

    /**
     * Returns the workflow templates
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {String} templateId - The id of the workflow template we want to retrieve
     */
    async getTemplates(logger, { templateId }) {
      logger.where(__filename, 'getTemplates').accessing();

      const template = await templateRepository.fetch(logger, templateId);

      if (!template) {
        logger.where(__filename, 'getTemplates').warn('No template found with that id');
        throw workflowResponses.no_templates_found_ko;
      }
      logger.where(__filename, 'getTemplates').end();
      return template;
    },

    /**
     * Deletes a workflow template
     * @public
     * @param {Object} logger - The log object
     * @param {Object} templateId - The id of the template to update
     */
    async deleteTemplate(logger, {templateId}) {
      logger.where(__filename, 'deleteTemplate').accessing();

      await templateRepository.removeTemplate(logger, templateId);

      logger.where(__filename, 'deleteTemplate').end();
    }
  };
}

module.exports = makeWorkflowService;

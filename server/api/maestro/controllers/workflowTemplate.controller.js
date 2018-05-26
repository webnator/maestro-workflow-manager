'use strict';

// Joi Models
const WorflowCreationSchema = require('../models/createWorkflow.schema');
const WorflowUpdateSchema = require('../models/updateWorkflow.schema');

function makeService(deps) {
  const {
    ResponsesService,
    ValidationService,
    WorkflowTemplateService,
    workflowResponses
  } = deps;

  return {
    /**
     * Creates a new workflow template
     * FROM POST - /templates
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async createTemplate(request, reply) {
      const { logger, payload } = request;
      logger.where(__filename, 'createTemplate').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowCreationSchema());
        await WorkflowTemplateService.createTemplate(logger, {templateObject});

        response = ResponsesService.createResponseData(workflowResponses.wf_template_created_ok);
        logger.where(__filename, 'createTemplate').info('Template created correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'createTemplate').warn({err}, 'Template not created');
      }
      logger.where(__filename, 'createTemplate').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Updates a workflow template
     * FROM POST - /templates
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async updateTemplate(request, reply) {
      const { logger, payload, params } = request;
      logger.where(__filename, 'updateTemplate').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowUpdateSchema());
        await WorkflowTemplateService.updateTemplate(logger, {templateObject, templateId: params.templateId});

        response = ResponsesService.createResponseData(workflowResponses.wf_template_updated_ok);
        logger.where(__filename, 'updateTemplate').info('Template updated correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'updateTemplate').warn({err}, 'Template not updated');
      }
      logger.where(__filename, 'updateTemplate').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Gets all workflow templates
     * FROM GET - /templates
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async getTemplates(request, reply) {
      const { logger, params } = request;

      logger.where(__filename, 'getTemplates').accessing();
      let response;
      try {
        const templates = await WorkflowTemplateService.getTemplates(logger, { templateId: params.templateId});
        response = ResponsesService.createResponseData(workflowResponses.wf_template_retrieved_ok, templates);

        logger.where(__filename, 'getTemplates').info('Templates retrieved correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'getTemplates').warn({err}, 'Templates not retrieved');
      }
      logger.where(__filename, 'getTemplates').end();
      return reply(response.body).code(response.statusCode);
    },

    /**
     * Deletes a workflow template
     * FROM DELETE - /templates/{templateId}
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async deleteTemplate(request, reply) {
      const { logger, params } = request;

      logger.where(__filename, 'deleteTemplate').accessing();
      let response;
      try {
        await WorkflowTemplateService.deleteTemplate(logger, {templateId: params.templateId});

        response = ResponsesService.createResponseData(workflowResponses.wf_template_deleted_ok);
        logger.where(__filename, 'deleteTemplate').info('Template deleted correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'deleteTemplate').warn({err}, 'Template not deleted');
      }
      logger.where(__filename, 'deleteTemplate').end();
      return reply(response.body).code(response.statusCode);
    },

  };
}

module.exports = makeService;


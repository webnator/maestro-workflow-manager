'use strict';

// Joi Models
const WorflowCreationSchema = require('../models/createWorkflow.schema');
const WorflowUpdateSchema = require('../models/updateWorkflow.schema');

function makeWorkflowController(deps) {
  const {
    ResponsesService,
    ValidationService,
    LogService,
    WorkflowTemplateService: WorkflowService,
    workflowResponses: responses
  } = deps;

  return {
    /**
     * Creates a new workflow template
     * FROM POST - /templates
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async createTemplate(request, reply) {
      const { logger, payload } = request;
      logger.method(__filename, 'createTemplate').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowCreationSchema());
        await WorkflowService.createTemplate(logger, {templateObject});
        response = ResponsesService.createResponseData(responses.wf_template_created_ok);
        logger.method(__filename, 'createTemplate').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'createTemplate').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

    /**
     * Updates a workflow template
     * FROM POST - /templates
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async updateTemplate(request, reply) {
      const { logger, payload, params } = request;
      logger.method(__filename, 'updateTemplate').accessing();

      let response;
      try {
        const templateObject = await ValidationService.validateSchema(payload, new WorflowUpdateSchema());
        await WorkflowService.updateTemplate(logger, {templateObject, templateId: params.templateId});
        response = ResponsesService.createResponseData(responses.wf_template_updated_ok);
        logger.method(__filename, 'updateTemplate').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'updateTemplate').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

    /**
     * Gets all workflow templates
     * FROM GET - /templates
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async getTemplates(request, reply) {
      const { logger, params } = request;

      logger.method(__filename, 'getTemplates').accessing();
      let response;
      try {
        const templates = await WorkflowService.getTemplates(logger, { templateId: params.templateId});
        response = ResponsesService.createResponseData(responses.wf_template_retrieved_ok, templates);
        logger.method(__filename, 'getTemplates').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'getTemplates').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

    /**
     * Deletes a workflow template
     * FROM DELETE - /templates/{templateId}
     * @public
     * @static
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async deleteTemplate(request, reply) {
      const { logger, params } = request;

      logger.method(__filename, 'deleteTemplate').accessing();
      let response;
      try {
        await WorkflowService.deleteTemplate(logger, {templateId: params.templateId});
        response = ResponsesService.createResponseData(responses.wf_template_deleted_ok);
        logger.method(__filename, 'deleteTemplate').success('OK');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.method(__filename, 'deleteTemplate').fail(err);
      } finally {
        reply(response.body).code(response.statusCode);
      }
    },

  };
}

module.exports = makeWorkflowController;


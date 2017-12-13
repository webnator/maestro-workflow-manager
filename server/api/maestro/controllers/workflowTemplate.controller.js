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
      const { logger } = request;
      let data = {
        logData: LogService.logData(request),
        payload: request.payload,
        schema: new WorflowCreationSchema()
      };

      logger.method(__filename, 'createTemplate').accessing();

      ValidationService.validateSchema(data)
        .then(WorkflowService.createTemplate)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_template_created_ok);
          LogService.info(data.logData, 'WorflowTemplateController createTemplate | OK');
          return reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowTemplateController createTemplate | KO', response.body);
          return reply(response.body).code(response.statusCode);
        });
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
      let data = {
        logData: LogService.logData(request),
        params: request.params,
        payload: request.payload,
        schema: new WorflowUpdateSchema()
      };

      LogService.info(data.logData, 'WorflowTemplateController updateTemplate | Accessing');

      ValidationService.validateSchema(data)
        .then(WorkflowService.updateTemplate)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_template_updated_ok);
          LogService.info(data.logData, 'WorflowTemplateController updateTemplate | OK');
          return reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowTemplateController updateTemplate | KO', response.body);
          return reply(response.body).code(response.statusCode);
        });
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
        return reply(response.body).code(response.statusCode);
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
    deleteTemplate(request, reply) {
      let data = {
        logData: LogService.logData(request),
        params: request.params
      };

      LogService.info(data.logData, 'WorflowTemplateController deleteTemplate | Accessing');

      WorkflowService.deleteTemplate(data)
        .then((data) => {
          let response = ResponsesService.createResponseData(data.logData, responses.wf_template_deleted_ok, data.response);
          LogService.info(data.logData, 'WorflowTemplateController deleteTemplate | OK');
          return reply(response.body).code(response.statusCode);
        })
        .catch((err) => {
          let response = ResponsesService.createGeneralError(err, data.logData);
          LogService.error(data.logData, 'WorflowTemplateController deleteTemplate | KO', response.body);
          return reply(response.body).code(response.statusCode);
        });
    },

  };
}

module.exports = makeWorkflowController;


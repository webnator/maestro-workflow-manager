'use strict';

const config = require('./../../../config/environment');

function makeWorkflowService(deps) {
  const {
    workflowEntityFactory,
    workflowProcessEntityFactory,
    workflowResponses: responses,
    QueueService
  } = deps;

  return {
    /**
     * Starts the execution of a workflow
     * @public
     * @param {Object} logger - The log object
     * @param {Object} templateId - The template id of the flow
     * @param {Object} request - The request object
     */
    async executeFlow(logger, { templateId, request }) {
      logger.method(__filename, 'executeFlow').accessing();

      const workflowTemplate = workflowEntityFactory({logger, templateId});
      try {
        const template = await workflowTemplate.fetchTemplate({templateId});
        if (!template) {
          logger.method(__filename, 'executeFlow').error('flow doesnt exist');
          await QueueService.publishHTTP(config.topics.unhandled_flows, request.payload, request.headers, request.query, request.params);
          throw responses.no_templates_found_ko;
        }
        const workflowProcess = workflowProcessEntityFactory({logger, templateObject: workflowTemplate.getTemplateObject()});
        workflowProcess.setLogObjectData({payload: request.payload});
        await workflowProcess.saveToDDBB();
        request.headers['x-flowprocessid'] = workflowProcess.getProcessUuid();
        logger.method(__filename, 'executeFlow').success();
        return { request, workflowProcess };
      } catch (err) {
        throw err;
      }
    },

    /**
     * Process the next task of a workflow
     * @public
     * @param {Object} logger - The log object
     * @param {Object} request - The request object
     */
    async processFlow(logger, {request}) {
      logger.method(__filename, 'processFlow').accessing();

      const workflowProcess = workflowProcessEntityFactory({processUuid: request.headers['x-flowprocessid']});
      workflowProcess.setProcessStep(request.headers['x-flowtaskid']);
      workflowProcess.setProcessResponse(request.payload);

      try {
        await workflowProcess.fetchProcess();

        workflowProcess.setCurrentTask();
        workflowProcess.checkResponse(request.headers['x-flowresponsecode']);
        workflowProcess.updateTasks(request.headers);
        workflowProcess.executeProcess();
        workflowProcess.checkCompletion(request.headers);

        await workflowProcess.updateInDDBB();

        logger.method(__filename, 'processFlow').success();
      } catch (err) {
        logger.method(__filename, 'processFlow').error('Error executing the flow', err);
        throw err;
      }
    },

    /**
     * Continues a previously errored workflow
     * @public
     * @param {Object} logger - The log object
     * @param {Object} request - The request object
     */
    async continueFlow(logger, {request}) {
      logger.method(__filename, 'continueFlow').accessing();

      const workflowProcess = workflowProcessEntityFactory({processUuid: request.payload.processUuid});
      try {
        await workflowProcess.fetchProcess();

        // If the process has no error don't continue
        if (!workflowProcess.checkIfProcessHasError()) {
          throw responses.workflow_already_completed_ko;
        }

        const lastStepUuid = workflowProcess.getLastErroredStep().taskUuid;
        workflowProcess.setNextProcessStep(lastStepUuid);
        workflowProcess.executeProcess();
        workflowProcess.checkCompletion(request.headers);

        await workflowProcess.updateInDDBB(data);

        logger.method(__filename, 'continueFlow').success();
      } catch (err) {
        logger.method(__filename, 'continueFlow').error('Error continuing the flow', err);
        throw err;
      }
    },

  };
}

module.exports = makeWorkflowService;

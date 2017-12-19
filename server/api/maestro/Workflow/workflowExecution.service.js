'use strict';

const config = require('./../../../config/environment');

function makeWorkflowService(deps) {
  const {
    LogService,
    workflowEntityFactory,
    workflowProcessEntityFactory,
    workflowResponses: responses,
    QueueService
  } = deps;

  return {
    /**
     * Starts the execution of a workflow
     * @public
     * @static
     * @param {Object} logger - The log object
     * @param {Object} templateId - The template id of the flow
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    async executeFlow(logger, { templateId, data }) {
      logger.method(__filename, 'executeFlow').accessing();

      const workflowTemplate = workflowEntityFactory({logger, templateId});
      try {
        const template = await workflowTemplate.fetchTemplate({templateId});
        if (!template) {
          logger.method(__filename, 'executeFlow').error('flow doesnt exist');
          await QueueService.publishHTTP(config.topics.unhandled_flows, data.payload, data.headers, data.query, data.params);
          throw responses.no_templates_found_ko;
        }
        const workflowProcess = workflowProcessEntityFactory({logger, templateObject: workflowTemplate.getTemplateObject()});
        workflowProcess.setLogObjectData({payload: data.payload});
        await workflowProcess.saveToDDBB();
        data.headers['x-flowprocessid'] = workflowProcess.getProcessUuid();
        logger.method(__filename, 'executeFlow').success();
        return { data, workflowProcess };
      } catch (err) {
        throw err;
      }
    },

    /**
     * Process the next task of a workflow the execution of a workflow
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    async processFlow(data) {
      LogService.info(data.logData, 'WFExecutionService processFlow | Accessing');
      data.workflowProcess = workflowProcessEntityFactory({processUuid: data.headers['x-flowprocessid']});
      data.workflowProcess.setProcessStep(data.headers['x-flowtaskid']);
      data.workflowProcess.setProcessResponse(data.payload);


      try {
        await data.workflowProcess.fetchProcess(data);

        data.workflowProcess.setCurrentTask();
        data.workflowProcess.checkResponse(data);
        data.workflowProcess.updateTasks(data);
        data.workflowProcess.executeProcess(data);
        data.workflowProcess.checkCompletion(data);

        await data.workflowProcess.updateInDDBB(data);

        LogService.info(data.logData, 'WFExecutionService processFlow | OK');
        return Promise.resolve(data);
      } catch (err) {
        LogService.error(data.logData, 'WFExecutionService processFlow | KO', err);
        return Promise.reject(err);
      }
    },

    /**
     * Continues a previously errored workflow
     * @public
     * @static
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    async continueFlow(data) {
      LogService.info(data.logData, 'WFExecutionService continueFlow | Accessing');
      data.workflowProcess = workflowProcessEntityFactory({processUuid: data.payload.processUuid});

      try {
        await data.workflowProcess.fetchProcess(data);

        // If the process has no error don't continue
        if (!data.workflowProcess.checkIfProcessHasError()) {
          throw responses.workflow_already_completed_ko;
        }

        const lastStepUuid = data.workflowProcess.getLastErroredStep().taskUuid;
        data.workflowProcess.setNextProcessStep(lastStepUuid);
        data.workflowProcess.executeProcess(data);
        data.workflowProcess.checkCompletion(data);

        await data.workflowProcess.updateInDDBB(data);

        LogService.info(data.logData, 'WFExecutionService continueFlow | OK');
        return Promise.resolve(data);
      } catch (err) {
        LogService.error(data.logData, 'WFExecutionService continueFlow | KO', err);
        return Promise.reject(err);
      }
    },

  };
}

module.exports = makeWorkflowService;

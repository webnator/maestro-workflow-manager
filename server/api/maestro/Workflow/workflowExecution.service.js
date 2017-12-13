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
     * @param {Object} data - The container object
     * @returns {Promise}
     */
    executeFlow(data) {
      return new Promise(function (resolve, reject) {
        LogService.info(data.logData, 'WFExecutionService executeFlow | Accessing');
        data.workflowTemplate = workflowEntityFactory({templateId: data.headers['x-flowid']});

        return data.workflowTemplate.fetchTemplate(data)
          .then(() => {
            if (!data.workflowTemplate.getTemplateObject()) {
              LogService.info(data.logData, 'WFExecutionService executeFlow | KO flow doesnt exist');
              QueueService.publishHTTP(config.topics.unhandled_flows, data.payload, data.headers, data.query, data.params);
              return reject(responses.no_templates_found_ko);
            }
            data.workflowProcess = workflowProcessEntityFactory({templateObject: data.workflowTemplate.getTemplateObject()});
            data.workflowProcess.setLogObjectData(data);
            return data;
          }).then((data) => data.workflowProcess.saveToDDBB(data))
          .then(() => {
            data.headers['x-flowprocessid'] = data.workflowProcess.getProcessUuid();
            LogService.info(data.logData, 'WFExecutionService executeFlow | OK');
            return resolve(data);
          }).catch((err) => {
            LogService.error(data.logData, 'WFExecutionService executeFlow | KO', err);
            return reject(err);
          });
      });
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

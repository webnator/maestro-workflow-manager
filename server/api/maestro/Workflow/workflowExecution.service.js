'use strict';

const ProcessStatusModel = require('./models/processStatus.model');
const processConfig = require('./models/process.config');

function makeWorkflowService(deps) {
  const {
    workflowResponses,
    QueueService,
    config,
    RepositoryFactory,
    REPOSITORY_NAME_TEMPLATES,
    REPOSITORY_NAME_PROCESSES,
    processModel,
    WorkflowExecutionUtils
  } = deps;

  const templateRepository = RepositoryFactory.getRepository(REPOSITORY_NAME_TEMPLATES);
  const processRepository = RepositoryFactory.getRepository(REPOSITORY_NAME_PROCESSES);

  return {
    /**
     * Starts the execution of a workflow
     * @param {Object} logger - The log object
     * @param {Object} templateId - The template id of the flow
     * @param {Object} request - The request object
     */
    async executeFlow(logger, { templateId, request }) {
      logger.where(__filename, 'executeFlow').accessing();

      const template = await templateRepository.fetch(logger, templateId);
      if (!template) {
        logger.where(__filename, 'executeFlow').error('Flow doesnt exist');
        await QueueService.publishHTTP(config.queues.unhandled_flows, request);
        throw workflowResponses.no_templates_found_ko;
      }

      const myProcess = processModel({template, request});
      await processRepository.save(logger, myProcess);

      logger.where(__filename, 'executeFlow').end();
      return myProcess.processUuid;
    },

    /**
     * Receives and handles the result of an executed task in the workflow
     * @param {Object} logger - The log object
     * @param {String} processId - The uuid of the process being executed
     * @param {String} taskId - The task id that was executed
     * @param {String} traceId - The trace for the request
     * @param {Object} headers - The headers of the task
     * @param {Object} payload - The result of the executed task
     * @returns {Promise<void>}
     */
    async handleFinishedTask(logger, processId, taskId, { headers, payload, traceId }) {
      logger.where(__filename, 'handleFinishedTask').accessing();
      let process = await processRepository.fetch(logger, processId);
      const task = WorkflowExecutionUtils.setTaskResponse({
        tasks: process.tasks,
        taskId: taskId,
        taskInfo: headers,
        response: payload
      });

      const taskIsValid = await WorkflowExecutionUtils.checkTaskExecution(logger, task, {
        processId: process.processUuid,
        traceId
      });

      if (taskIsValid) {
        logger.where(__filename, 'handleFinishedTask').debug('Task response is valid');
        task.status.push(new ProcessStatusModel(processConfig.status.COMPLETED, task.dateFinished));
      } else {
        const failedPayload = {
          code: task.receivedCode,
          response: task.response,
        };
        logger.where(__filename, 'handleFinishedTask').warn('Task response is not valid');
        task.status.push(new ProcessStatusModel(processConfig.status.FAILED, task.dateFinished, failedPayload));
      }
      await processRepository.updateProcess(logger, process.processUuid, process);

      if (taskIsValid) {
        logger.where(__filename, 'handleFinishedTask').info('Sending next task for execution');
        await QueueService.publishHTTP(config.topics.continue, { payload: { processUuid: processId } });
      } else {
        process = WorkflowExecutionUtils.setProcessFinish(process, taskId);
        await processRepository.updateProcess(logger, process.processUuid, process);
        logger.where(__filename, 'executeNextProcessTask').warn({processId}, 'Process has ended with errors');
      }
      logger.where(__filename, 'handleFinishedTask').end();
    },

    /**
     * Executes the next task in a process
     * @param {Object} logger - The log object
     * @param {String} processId - The uuid of the process to continue
     * @param {Object} [payload] - The payload to send to the task, this is used only for the first task in a flow. Optional
     * @returns {Promise<void>}
     */
    async executeNextProcessTask(logger, processId, payload) {
      logger.where(__filename, 'executeNextProcessTask').accessing();
      let process = await processRepository.fetch(logger, processId);
      const task = WorkflowExecutionUtils.getNextTask(process);
      if (task) {
        const taskPayload = payload || WorkflowExecutionUtils.getPreviousTaskResponse(process);

        task.request = WorkflowExecutionUtils.setRequestForTask(task, taskPayload);
        await WorkflowExecutionUtils.executeNextTask(task, process.processUuid);
      } else {
        process = WorkflowExecutionUtils.setProcessFinish(process);
        logger.where(__filename, 'executeNextProcessTask').info('Process has ended');
      }
      await processRepository.updateProcess(logger, process.processUuid, process);
      logger.where(__filename, 'executeNextProcessTask').end();
    },

    /**
     * Continues a previously errored workflow
     * @public
     * @param {Object} logger - The log object
     * @param {String} processUuid - The uuid of the process to resume
     * @param {String} processName - The template name for the process to resume
     * We ask for both to avoid problems of uuid not matching processes
     */
    async resumeErroredFlow(logger, {processUuid, processName}) {
      logger.where(__filename, 'continueFlow').accessing();

      let process = await processRepository.fetch(logger, processUuid);
      if (!process || process.flowName !== processName) {
        logger.where(__filename, 'continueFlow').warn('Process doesnt exist');
        throw workflowResponses.no_workflow_found_ko;
      }

      if (WorkflowExecutionUtils.processHasEndedOk(process)) {
        logger.where(__filename, 'continueFlow').warn('Process finished correctly');
        throw workflowResponses.workflow_already_completed_ko;
      }
      process.status.push(new ProcessStatusModel(processConfig.status.RESTARTED));

      const lastErroredTask = WorkflowExecutionUtils.getLastErroredTask(process);
      if (!lastErroredTask) {
        logger.where(__filename, 'continueFlow').info('All tasks finished correctly');
        process.status.push(new ProcessStatusModel(processConfig.status.COMPLETED));
      } else {
        await WorkflowExecutionUtils.executeNextTask(lastErroredTask, process.processUuid, {restarted: true});
      }

      await processRepository.updateProcess(logger, process.processUuid, process);
      logger.where(__filename, 'continueFlow').end();
    },

    /**
     * Retrieves all started processes
     * @param {Object} logger - The log object
     * @param {Object} query - The request query object
     */
    async getStartedProcesses(logger, { query }) {
      logger.where(__filename, 'getStartedProcesses').accessing();

      let processes = await processRepository.getCompletedProcesses(logger, {
        from: query.from,
        to: query.to,
        processName: query.processName,
        processUuid: query.processUuid,
      });

      if (query.status && query.status.trim !== '') {
        const statusesToFind = query.status.split(',').map(status => status.toLowerCase());
        processes = processes.filter(process => statusesToFind.includes(WorkflowExecutionUtils.getProcessStatus(process).toLowerCase()));
      }
      logger.where(__filename, 'getStartedProcesses').end();
      return processes;
    },

  };
}

module.exports = makeWorkflowService;

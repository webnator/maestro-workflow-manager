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
     * Process the next task of a workflow
     * @param {Object} logger - The log object
     * @param {Object} request - The request object
     */
    async processFlow(logger, { request }) {
      logger.where(__filename, 'processFlow').accessing();

      let process = await processRepository.fetch(logger, request.headers['x-flowprocessid']);

      let currentTask, nextTask;
      // If there's a previous task that has been executed
      if (request.headers['x-flowtaskid']) {
        currentTask = WorkflowExecutionUtils.setCurrentTask({
          tasks: process.tasks,
          taskInfo: request.headers,
          response: request.payload
        });
        const taskIsValid = await WorkflowExecutionUtils.checkTaskExecution(currentTask, {
          receivedStatus: request.headers['x-flowresponsecode'],
          request,
          processId: process.processUuid
        });

        if (taskIsValid) {
          currentTask.status.push(new ProcessStatusModel(processConfig.status.COMPLETED, currentTask.dateFinished));
          nextTask = WorkflowExecutionUtils.getNextTask(process.tasks, currentTask.taskUuid);

        } else {
          const failedPayload = {
            code: currentTask.receivedCode,
            response: currentTask.response,
          };
          currentTask.status.push(new ProcessStatusModel(processConfig.status.FAILED, currentTask.dateFinished, failedPayload));
        }
      } else {
        // If there's no current task it means we're at the beginning of the process
        nextTask = process.tasks[0];
      }

      // If there's a next task to be executed
      if (nextTask) {
        nextTask.request = WorkflowExecutionUtils.setRequestForTask({task: nextTask, request, previousTask: currentTask});
        await WorkflowExecutionUtils.executeNextTask(nextTask, process.processUuid);
      } else {
        process = WorkflowExecutionUtils.setProcessFinish(process, currentTask);
      }

      await processRepository.updateProcess(logger, process.processUuid, process);
      logger.where(__filename, 'processFlow').end();
    },

    /**
     * Continues a previously errored workflow
     * @public
     * @param {Object} logger - The log object
     * @param {String} processUuid - The uuid of the process to resume
     * @param {String} processName - The template name for the process to resume
     * We ask for both to avoid problems of uuid not matching processes
     */
    async continueFlow(logger, {processUuid, processName}) {
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

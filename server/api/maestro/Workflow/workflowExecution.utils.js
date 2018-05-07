'use strict';

const ProcessStatusModel = require('./models/processStatus.model');
const processConfig = require('./models/process.config');

function makeService(deps) {
  const {
    config,
    jsonschema,
    QueueService
  } = deps;


  return {
    /**
     * Sets the current workflow task from a list of tasks and the task id received in the headers
     * @param {Array} tasks - List of tasks of a process
     * @param {Object} taskInfo - The information received in the headers
     * @param {Object} response - The process response
     * @returns {Object} The current task to work with, with its information set
     */
    setCurrentTask({tasks, taskInfo, response}) {
      const currentTask = tasks.find(task => task.taskUuid === taskInfo['x-flowtaskid']);
      currentTask.dateFinished = taskInfo['x-flowtaskfinishedon'] ? new Date(taskInfo['x-flowtaskfinishedon']) : new Date();
      currentTask.receivedCode = taskInfo['x-flowresponsecode'];
      currentTask.response = response;
      return currentTask;
    },

    /**
     * Retrieves the next task that follows the current one
     * @param {Array} tasks - List of tasks of a process
     * @param {String} currentTaskId - The uuid of the task already executed
     * @returns {*}
     */
    getNextTask(tasks, currentTaskId) {
      return tasks[tasks.findIndex(task => task.taskUuid === currentTaskId) + 1];
    },

    /**
     * Checks that a task has responded as expected. Also does a jsonschema check
     * @param {Object} task - The task object to check
     * @param {String} processId - The uuid of the process which the tasks belongs to
     * @param {Number} receivedStatus - Received HTTP status of the request
     * @param {Object} request - The object of the request received
     * @param {*} request.payload - The payload of the request received
     * @returns {Promise.<boolean>}
     */
    async checkTaskExecution(task, { processId, receivedStatus, request }) {
      if (task.expectedResponse === receivedStatus) {

        if (task.responseSchema) {
          const validationResponse = jsonschema.validate(request.payload, task.responseSchema);
          if (validationResponse.errors && validationResponse.errors.length > 0) {
            const badPayload = {
              request: request,
              task: task.taskUuid,
              process: processId,
              errors: validationResponse.errors
            };
            await QueueService.publishHTTP(config.queues.inconsistent_responses, { payload: badPayload, traceId: request.traceId });
          }
        }
        return true;
      } else {
        return false;
      }
    },

    /**
     * Executes a task from a process
     * @param {Object} task - The task object to check
     * @param {String} processId - The uuid of the process which the tasks belongs to
     * @param {Boolean} restarted - Wether the task has been restarted or not
     * @returns {Promise.<void>}
     */
    async executeNextTask(task, processId, { restarted = false } = {}) {
      task.dateStarted = new Date();
      if (restarted === true) {
        task.status.push(new ProcessStatusModel(processConfig.status.RESTARTED));
      } else {
        task.status.push(new ProcessStatusModel(processConfig.status.STARTED));
      }

      if (task.type === 'QUEUE') {
        const topic = task.executionInfo.topic;
        task.request.headers = Object.assign({}, task.request.headers, {
          'x-flowprocessid': processId,
          'x-flowtaskid': task.taskUuid,
          'x-flowinformtopic': config.topics.inform
        });
        await QueueService.publishHTTP(topic, task.request);
      } else if (task.type === 'HTTP') {
        const topic = config.topics.handle_http;
        const httpRequest = {
          headers: {

            'x-flowprocessid': processId,
            'x-flowtaskid': task.taskUuid,
            'x-flowinformtopic': config.topics.inform
          },
          payload: {
            request: Object.assign({}, task.request, {
              url: task.executionInfo.url,
              method: task.executionInfo.method || 'GET',
            })
          }
        };
        await QueueService.publishHTTP(topic, httpRequest);
      }
    },

    /**
     * Sets the final status of a process receiving its final executed task
     * @param {Object} process - The process object
     * @param {Object} lastTask - The last task executed object
     * @returns {*}
     */
    setProcessFinish(process, lastTask) {
      process.endDate = lastTask.dateFinished;
      process.status.push(new ProcessStatusModel(lastTask.status[lastTask.status.length - 1].status));
      return process;
    },

    /**
     * Returns the current status of a process
     * @param {Object} process - The process object
     * @returns {String} Status
     */
    getProcessStatus(process) {
      return process.status[process.status.length - 1].status;
    },

    /**
     * Checks if a process has finished successfully
     * @param {Object} process - The process object
     * @returns {boolean}
     */
    processHasEndedOk(process) {
      return this.getProcessStatus(process) === processConfig.status.COMPLETED;
    },

    /**
     * Retrieves the last task that failed in a process
     * @param process
     */
    getLastErroredTask(process) {
      return process.tasks.find(task => this.getProcessStatus(task) === processConfig.status.FAILED);
    }
  };
}

module.exports = makeService;

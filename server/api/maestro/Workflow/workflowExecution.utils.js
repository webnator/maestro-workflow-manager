'use strict';

const ProcessStatusModel = require('./models/processStatus.model');
const processConfig = require('./models/process.config');

function makeService(deps) {
  const {
    config,
    jsonschema,
    QueueService,
    TaskFilterService
  } = deps;

  /**
   * Sets the current workflow task from a list of tasks and the task id received in the headers
   * @param {Array} tasks - List of tasks of a process
   * @param {String} taskId - The id of the task to set the response for
   * @param {Object} taskInfo - The information received in the headers
   * @param {Object} response - The process response
   * @returns {Object} The current task to work with, with its information set
   */
  function setTaskResponse({tasks, taskId, taskInfo, response}) {
    response = {payload: response};
    const currentTask = tasks.find(task => task.taskUuid === taskId);
    currentTask.dateFinished = taskInfo['x-flowtaskfinishedon'] ? new Date(taskInfo['x-flowtaskfinishedon']) : new Date();
    currentTask.receivedCode = taskInfo['x-flowresponsecode'];

    if (currentTask.post_filters && currentTask.post_filters.length > 0) {
      response = TaskFilterService.applyFilters(response, currentTask.post_filters);
    }
    currentTask.response = response;
    return currentTask;
  }

  /**
   * Checks that a task has responded as expected. Also does a jsonschema check
   * @param {Object} logger - The log object
   * @param {Object} task - The task object to check
   * @param {String} processId - The uuid of the process which the tasks belongs to
   * @param {String} traceId - The trace of the request
   * @returns {Promise.<boolean>}
   */
  async function checkTaskExecution(logger, task, { traceId, processId }) {
    if (task.expectedResponse === task.receivedCode) {
      if (task.responseSchema) {
        const validationResponse = jsonschema.validate(task.response, task.responseSchema);
        if (validationResponse.errors && validationResponse.errors.length > 0) {
          const badPayload = {
            request: task.response,
            task: task.taskUuid,
            process: processId,
            errors: validationResponse.errors
          };
          logger.where(__filename, 'checkTaskExecution').warn({taskUuid: task.taskUuid, process: processId, response: task.receivedCode, errors: validationResponse.errors}, 'Task received unexpected payload schema');
          await QueueService.publishHTTP(config.queues.inconsistent_responses, { payload: badPayload, traceId: traceId });
        }
      }
      logger.where(__filename, 'checkTaskExecution').debug({taskUuid: task.taskUuid, process: processId, response: task.receivedCode}, 'Task received expected code');
      return true;
    } else {
      logger.where(__filename, 'checkTaskExecution').warn({taskUuid: task.taskUuid, process: processId, expected: task.expectedResponse, response: task.receivedCode}, 'Task received unexpected code');
      return false;
    }
  }

  /**
   * Sets the proper request object for a task from a received response
   * @param {Object} task - The task object to set the request for
   * @param {Object} payload - The body that shall be passed to the task
   * @returns {{payload: *, params: *, query: *, headers: *}}
   */
  function setRequestForTask(task, payload = {}) {
    let taskRequest = {payload};
    if (task.pre_filters && task.pre_filters.length > 0) {
      taskRequest = TaskFilterService.applyFilters(taskRequest, task.pre_filters);
    }

    return {
      payload: Object.assign({}, task.executionInfo.payload, taskRequest.payload),
      params: Object.assign({}, task.executionInfo.params, taskRequest.params),
      query: Object.assign({}, task.executionInfo.query, taskRequest.query),
      headers: Object.assign({}, task.executionInfo.headers, taskRequest.headers)
    };
  }

  /**
   * Executes a task from a process
   * @param {Object} task - The task object to check
   * @param {String} processId - The uuid of the process which the tasks belongs to
   * @param {Boolean} restarted - Wether the task has been restarted or not
   * @returns {Promise.<void>}
   */
  async function executeNextTask(task, processId, { restarted = false } = {}) {
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
  }

  /**
   * Sets the final status of a process
   * @param {Object} process - The process object
   * @param {String} [taskId] - The id of the last failed task. Should only be sent when a task has errors. Optional, if not provided sets the last task as the last completed one
   * @returns {*}
   */
  function setProcessFinish(process, taskId) {
    let lastTask = process.tasks[this.getLastCompletedTaskIndex(process)];
    if (taskId) {
      lastTask = process.tasks.find(task => task.taskUuid === taskId);
    }

    process.endDate = lastTask.dateFinished;
    process.status.push(new ProcessStatusModel(lastTask.status[lastTask.status.length - 1].status));
    return process;
  }

  /**
   * Returns the current status of a process
   * @param {Object} process - The process object
   * @returns {String} Status
   */
  function getProcessStatus(process) {
    return process.status[process.status.length - 1].status;
  }

  /**
   * Checks if a process has finished successfully
   * @param {Object} process - The process object
   * @returns {boolean}
   */
  function processHasEndedOk(process) {
    return this.getProcessStatus(process) === processConfig.status.COMPLETED;
  }

  /**
   * Retrieves the last task that failed in a process
   * @param {Object} process - The process object to get the task for
   */
  function getLastErroredTask(process) {
    process.tasks.reverse();
    const lastError = process.tasks.find(task => this.getProcessStatus(task) === processConfig.status.FAILED);
    process.tasks.reverse();
    return lastError;
  }

  /**
   * Retrieves the index for the last task that was completed in a process
   * @param {Object} process - The process object to get the task for
   */
  function getLastCompletedTaskIndex(process) {
    process.tasks.reverse();
    let lastTask = process.tasks.findIndex(task => this.getProcessStatus(task) === processConfig.status.COMPLETED);
    if (lastTask !== -1) {
      lastTask = (process.tasks.length - lastTask) - 1;
    }
    process.tasks.reverse();
    return lastTask;
  }

  /**
   * Retrieves the next task to be executed in a process
   * @param {Object} process - The process object to get the task for
   */
  function getNextTask(process) {
    return process.tasks[this.getLastCompletedTaskIndex(process) + 1];
  }

  /**
   * Retrieves the response of the last COMPLETED task
   * @param {Object} process - The process object to get the task for
   */
  function getPreviousTaskResponse(process) {
    if (process.tasks[this.getLastCompletedTaskIndex(process)]) {
      return process.tasks[this.getLastCompletedTaskIndex(process)].response;
    }
  }

  return {
    setTaskResponse,
    checkTaskExecution,
    setRequestForTask,
    executeNextTask,
    setProcessFinish,
    getProcessStatus,
    processHasEndedOk,
    getLastErroredTask,
    getLastCompletedTaskIndex,
    getNextTask,
    getPreviousTaskResponse,
  };
}

module.exports = makeService;

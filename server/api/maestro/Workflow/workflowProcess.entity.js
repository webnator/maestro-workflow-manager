'use strict';

const schemaValidator = require('jsonschema').validate;

const processModel = require('./models/process.model');
const processConfig = require('./models/process.config');
const ProcessDataModel = require('./models/processData.model');
const ProcessStatusModel = require('./models/processStatus.model');
const config = require('./../../../config/environment');

class WorkflowProcessEntity {
  constructor(deps, opts) {
    const {
      LogService,
      RepositoryFactory,
      workflowResponses: responses,
      REPOSITORY_NAME_LOGS: repository,
      QueueService
    } = deps;
    opts = Object.assign(opts, {});

    this.repository = RepositoryFactory.getRepository(repository);
    this.LogService = LogService;
    this.QueueService = QueueService;
    this.responses = responses;

    this.logObject = {};
    this.setLogObjectFromTemplate(opts.templateObject);
    this.setProcessUuid(opts.processUuid);
  }

  setLogObjectFromTemplate(templateObject) {
    if (templateObject) {
      this.setLogObject(processModel(templateObject));
    }
  }
  setProcessUuid(processUuid) {
    if (processUuid) {
      this.logObject.processUuid = processUuid;
    }
  }
  setLogObject(logObject) {
    this.logObject = logObject;
  }
  setLogObjectData(data) {
    this.logObject.data = new ProcessDataModel(data);
  }
  setProcessResponse(processResponse) {
    this.response = processResponse;
  }
  setProcessData(processData) {
    this.processData = processData;
  }
  setProcessStep(stepUuid) {
    this.stepUuid = stepUuid;
  }
  setTaskError(hasError) {
    this.taskWithError = hasError;
  }

  getTaskError() {
    return this.taskWithError;
  }
  getProcessStep() {
    return this.stepUuid;
  }
  getLogObject() {
    return this.logObject;
  }
  getTasks() {
    return this.getLogObject().tasks;
  }
  getLogObjectData() {
    return this.logObject.data;
  }
  getProcessUuid() {
    return this.logObject.processUuid;
  }
  getProcessData() {
    return this.processData;
  }
  getProcessResponse() {
    return this.response;
  }
  getCurrentTask() {
    if (this.currentTask !== null && this.logObject.tasks && this.logObject.tasks[this.currentTask]) {
      return this.logObject.tasks[this.currentTask];
    }
  }
  getNextTask() {
    if (this.nextTask) {
      return this.logObject.tasks[this.nextTask];
    } else if (this.getCurrentTask()) {
      if (this.currentTask !== null && this.logObject.tasks && this.logObject.tasks[this.currentTask + 1] && this.getTaskError() !== true) {
        return this.logObject.tasks[this.currentTask + 1];
      }
    } else {
      return this.logObject.tasks[0];
    }
  }

  /**
   * Sets the current task
   */
  setCurrentTask() {
    const tasks = this.logObject.tasks;
    const currentStep = this.getProcessStep();
    if (currentStep) {
      this.currentTask = tasks.findIndex((task) => {
        return task.taskUuid === currentStep;
      });
    } else {
      this.currentTask = null;
    }
  }

  /**
   * Sets the next process task
   * @param {String} nextProcessUuid - The uuid of the next process
   */
  setNextProcessStep(nextProcessUuid) {
    const tasks = this.logObject.tasks;
    this.nextTask = tasks.findIndex((task) => {
      return task.taskUuid === nextProcessUuid;
    });
  }

  /**
   * Validates the payload against the schema and if they don't fit, send it to the queue
   * @param {Object} payload - The payload to validate
   * @param {Object} schema - The JSON Schema to validate against
   */
  validateSchema(payload, schema) {
    const validationResponse = schemaValidator(payload, schema);
    if (validationResponse.errors && validationResponse.errors.length > 0) {
      const badPayload = {
        payload: this.getProcessResponse(),
        task: this.getCurrentTask(),
        process: this.getProcessUuid(),
        errors: validationResponse.errors
      };
      this.QueueService.publishHTTP(config.queues.inconsistent_responses, badPayload);
    }
  }

  /**
   * Checks that the response for the task is valid, if not, continues the process but sends it to the queue
   * @param {Object} data - The container object
   */
  checkResponse(data) {
    let task = this.getCurrentTask();
    if (task) {
      if (task.expectedResponse === data.headers['x-flowresponsecode']) {
        this.validateSchema(this.getProcessResponse(), task.responseSchema);
        const newData = Object.assign(this.processData, this.response, {});
        this.setProcessData(newData);
      } else {
        this.setTaskError(true);
      }
    }
  }

  /**
   * Sets the previous task relevant data
   * @param {Object} headers - The request headers
   * @param {String} status - The task status
   */
  setPreviousTaskContent(headers, status) {
    let task = this.getCurrentTask();
    task.dateFinished = new Date(headers['x-flowtaskfinishedon']);
    task.receivedCode = headers['x-flowresponsecode'];
    task.receivedResponse = this.getProcessResponse();
    let failedPayload;
    if (status === processConfig.status.FAILED) {
      failedPayload = {
        code: task.receivedCode,
        response: task.receivedResponse,
      };
    }

    task.status.push(new ProcessStatusModel(status, task.dateFinished, failedPayload));
  }

  /**
   * Updates the data for the previous task and for the current one
   * @param data
   */
  updateTasks(data) {
    if (this.getCurrentTask()) {
      let status = processConfig.status.COMPLETED;
      let payload = null;
      if (this.getTaskError() === true) {
        status = processConfig.status.FAILED;
      }
      this.setPreviousTaskContent(data.headers, status, payload);
    }
    let nextTask = this.getNextTask();
    if (nextTask) {
      nextTask.dateStarted = new Date();
      nextTask.data = this.getProcessData();
      nextTask.status.push(new ProcessStatusModel(processConfig.status.STARTED));
    }
  }

  /**
   * Sends the current task and payload to the queue
   */
  executeProcess() {
    let nextTask = this.getNextTask();
    if (nextTask) {
      let topic = nextTask.service + '.' + nextTask.action;
      let headers = {
        'x-flowprocessid': this.getProcessUuid(),
        'x-flowtaskid': nextTask.taskUuid,
        'x-flowinformtopic': config.topics.inform
      };
      this.QueueService.publishHTTP(topic, this.getProcessData(), headers);
    }
  }

  /**
   * Checks if the complete workflow has already been completed
   */
  checkCompletion(data) {
    if (!this.getNextTask()) {
      this.logObject.endDate = new Date(data.headers['x-flowtaskfinishedon']);
      if (this.getTaskError() === true) {
        this.logObject.status.push(new ProcessStatusModel(processConfig.status.FAILED));
      } else {
        this.logObject.status.push(new ProcessStatusModel(processConfig.status.COMPLETED));
      }

    }
  }

  /**
   * Checks if the process has ended with errors
   * @returns {boolean}
   */
  checkIfProcessHasError() {
    let processStatus = this.getLogObject().status;
    const lastStatus = processStatus[processStatus.length - 1];
    if (lastStatus.status === processConfig.status.FAILED) {
      processStatus.push(new ProcessStatusModel(processConfig.status.RESTARTED));
      return true;
    } else {
      return false;
    }
  }

  getLastErroredStep() {
    const processTasks = this.getTasks();
    return processTasks.find((task) => {
      let taskStatus = task.status;
      const lastStatus = taskStatus[taskStatus.length - 1];
      if (lastStatus.status === processConfig.status.FAILED) {
        taskStatus.push(new ProcessStatusModel(processConfig.status.RESTARTED));
        return true;
      }
    });
  }


  /**
   * Saves the process to the DDBB
   * @param data
   * @returns {Promise}
   */
  saveToDDBB(data) {
    return new Promise((resolve, reject) => {
      this.LogService.info(data.logData, 'WorkflowProcessEntity saveToDDBB | Accessing');

      let DBObject = {
        logObject: this.getLogObject()
      };
      this.repository.save(DBObject, data.logData)
        .then(() => {
          this.LogService.info(data.logData, 'WorkflowProcessEntity saveToDDBB | OK');
          return resolve();
        })
        .catch((err) => {
          this.LogService.error(data.logData, 'WorkflowProcessEntity saveToDDBB | KO from DDBB', err);
          return reject(this.responses.ddbb_error);
        });
    });
  }

  /**
   * Update the process in the DDBB
   * @param data
   * @returns {Promise}
   */
  async updateInDDBB(data) {
    return new Promise((resolve, reject) => {
      this.LogService.info(data.logData, 'WorkflowProcessEntity updateInDDBB | Accessing');

      let DBObject = {
        logObject: this.getLogObject()
      };
      this.repository.updateLog(DBObject, data.logData)
        .then(() => {
          this.LogService.info(data.logData, 'WorkflowProcessEntity updateInDDBB | OK');
          return resolve();
        })
        .catch((err) => {
          this.LogService.error(data.logData, 'WorkflowProcessEntity updateInDDBB | KO from DDBB', err);
          return reject(this.responses.ddbb_error);
        });
    });
  }

  /**
   * Fetch the process from the DDBB
   * @param data
   * @returns {Promise}
   */
  async fetchProcess(data) {
    return new Promise((resolve, reject) => {
      this.LogService.info(data.logData, 'WorkflowProcessEntity fetchProcess | Accessing');

      let DBObject = {
        processUuid: this.getProcessUuid()
      };
      this.repository.fetch(DBObject, data.logData).then((res) => {
        if (res.dbData.result) {
          this.setLogObject(res.dbData.result);
          this.setProcessData(this.getLogObjectData());
          this.LogService.info(data.logData, 'WorkflowProcessEntity fetchProcess | OK');
          return resolve();
        } else {
          this.LogService.info(data.logData, 'WorkflowProcessEntity fetchProcess | KO No process');
          return reject(this.responses.no_workflow_found_ko);
        }
      }).catch((err) => {
        this.LogService.error(data.logData, 'WorkflowProcessEntity fetchProcess | KO from DDBB', err);
        return reject(this.responses.ddbb_error);
      });
    });
  }


}

module.exports = WorkflowProcessEntity;

'use strict';

const uuid = require('uuid');
const processConfig = require('./process.config');

function ProcessModel(templateObject) {
  if (templateObject) {
    let processModel = {
      flowName: templateObject.name,
      processUuid: uuid.v4(),
      startDate: new Date(),
      endDate: null,
      status: [{
        status: processConfig.status.STARTED,
        date: new Date()
      }],
      tasks: []
    };

    templateObject.tasks.forEach((task) => {
      processModel.tasks.push({
        taskUuid: uuid.v4(),
        service: task.service,
        action: task.action,
        expectedResponse: task.expectedResponse,
        responseSchema: task.responseSchema,
        dateStarted: null,
        dateFinished: null,
        data: null,
        receivedCode: null,
        receivedResponse: null,
        status: [{
          status: processConfig.status.CREATED,
          date: new Date()
        }]
      });
    });

    return processModel;
  }
  return templateObject;
}

module.exports = ProcessModel;

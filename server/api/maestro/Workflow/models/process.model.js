'use strict';

const processConfig = require('./process.config');

function makeService(deps) {
  const {
    uuid,
  } = deps;

  return ({template, request}) => {
    return {
      flowName: template.name,
      processUuid: uuid.v4(),
      startDate: new Date(),
      endDate: null,
      status: [{
        status: processConfig.status.STARTED,
        date: new Date()
      }],
      request,
      tasks: template.tasks.map((task) => ({
        taskUuid: uuid.v4(),
        type: task.type,
        executionInfo: task.executionInfo,
        expectedResponse: task.expectedResponse,
        responseSchema: task.responseSchema,
        dateStarted: null,
        dateFinished: null,
        request: null,
        receivedCode: null,
        response: null,
        pre_filters: task.pre_filters,
        post_filters: task.post_filters,
        status: [{
          status: processConfig.status.CREATED,
          date: new Date()
        }]
      }))
    };
  };
}

module.exports = makeService;

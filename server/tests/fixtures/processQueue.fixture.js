'use strict';

module.exports = {
  flowName: 'test-1',
  processUuid: 'f89773f7-9377-472f-a9c2-f8aa6d285b4f',
  startDate: '2018-05-25T02:59:13.802Z',
  endDate: null,
  status: [{
    status: 'STARTED',
    date: '2018-05-25T02:59:13.802Z'
  }],
  request: {
    payload: {},
    traceId: 'trace-123'
  },
  tasks: [{
    taskUuid: 'a048218a-449c-42b2-a41b-697faf6e3b24',
    type: 'QUEUE',
    executionInfo: {
      topic: 'book.create'
    },
    expectedResponse: 201,
    dateStarted: null,
    dateFinished: null,
    request: null,
    receivedCode: null,
    response: null,
    status: [{
      status: 'CREATED',
      date: '2018-05-25T02:59:13.804Z'
    }]}
  ]
};
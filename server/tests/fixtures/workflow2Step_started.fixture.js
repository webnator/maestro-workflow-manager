'use strict';

module.exports = {
  flowName: 'test-2',
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
    type: 'HTTP',
    executionInfo: {
      url: 'http://localhost:9001/v1/book',
      method: 'POST'
    },
    expectedResponse: 201,
    dateStarted: '2018-05-25T04:23:02.361Z',
    dateFinished: null,
    request: {
      payload: {
        param1: 'test-param-1',
        param2: 'test-param-2'
      },
      params: {},
      query: {},
      headers: {}
    },
    receivedCode: null,
    response: null,
    status: [{
      status: 'CREATED',
      date: '2018-05-25T02:59:13.804Z'
    }, {
      status: 'STARTED',
      date: '2018-05-25T04:23:02.361Z'
    }]
  }, {
    taskUuid: 'e9a23baf-c9f1-4257-8ea1-14bf0d77b3c5',
    type: 'HTTP',
    executionInfo: {
      url: 'http://localhost:9001/v1/book',
      method: 'GET'
    },
    expectedResponse: 200,
    responseSchema: null,
    dateStarted: null,
    dateFinished: null,
    request: null,
    receivedCode: null,
    response: null,
    pre_filters: null,
    post_filters: null,
    status: [{
      status: 'CREATED',
      date: '2018-05-25T23:34:22.861Z'
    }]
  }]
};
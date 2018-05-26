'use strict';

module.exports = {
  name: 'test-2',
  tasks: [{
    type: 'HTTP',
    executionInfo: {
      url: 'http://localhost:9001/v1/book',
      method: 'POST'
    },
    expectedResponse: 201
  }]
};
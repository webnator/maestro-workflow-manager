'use strict';

module.exports = {
  name: 'test-1',
  tasks: [{
    type: 'QUEUE',
    executionInfo: {
      topic: 'book.create'
    },
    expectedResponse: 201
  }]
};
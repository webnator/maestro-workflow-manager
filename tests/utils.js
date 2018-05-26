'use strict';

function createMockData(payload, additional) {
  return Object.assign({}, {
    logData: {
      method: 'test:method',
      path: 'test:path',
    },
    payload,
  }, additional);
}

function createMockUtils(statusCode, body) {
  return {
    sendRequest: jest.fn(() => Promise.resolve({
      reqData: {
        response: {
          statusCode
        },
        body
      }
    }))
  };
}

function LogServiceMock() {
  return {
    info: jest.fn(),
    error: jest.fn()
  };
}

function DBServiceMock(result) {
  return {
    findResultOk: jest.fn(() => Promise.resolve({
      dbData: {
        result: result
      }
    })),
    dbFailure: jest.fn(() => Promise.reject(result))
  };
}

function sendRequestMock(result, code, resolve = true) {
  return jest.fn((data) => {
    if (!data.reqData) {
      data.reqData = {};
    }
    data.reqData.response = {
      statusCode: code
    };
    data.reqData.body = result;

    if (resolve) {
      return Promise.resolve(data);
    } else {
      return Promise.reject(data);
    }
  });
}

function createMockUtilsError(error) {
  return {
    sendRequest: jest.fn(() => Promise.reject(error))
  };
}

exports.createMockUtilsError = createMockUtilsError;
exports.createMockData = createMockData;
exports.createMockUtils = createMockUtils;
exports.LogServiceMock = LogServiceMock;
exports.DBServiceMock = DBServiceMock;
exports.sendRequestMock = sendRequestMock;

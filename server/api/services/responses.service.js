'use strict';

function makeService() {
  return {
    createResponseData: (result, data, extra) => {
      let response = {
        statusCode: result.statusCode,
        body: {
          result: {
            code: result.code,
            message: result.message
          }
        }
      };
      if (data) {
        response.body.data = data;
      }
      if (extra) {
        response.body.extra = extra;
      }

      return response;
    },
    createInternalResponse: (statusCode, code, message) => {
      return {
        statusCode: statusCode,
        code: code,
        message: message,
      };
    },
    createGeneralError: (err) => {
      return {
        statusCode: err.statusCode || 500,
        body: {
          result: {
            code      : err.code || '50000',
            message   : err.message
          }
        }
      };
    }
  }
}

module.exports = makeService;

'use strict';

function ProcessStatusModel(status, date, failedPayload) {
  let statusObject = {
    status: status,
    date: date || new Date()
  };

  if (failedPayload) {
    statusObject.failedWith = {
      receivedCode: failedPayload.code,
      receivedResponse: failedPayload.response
    };
  }

  return statusObject;
}

module.exports = ProcessStatusModel;

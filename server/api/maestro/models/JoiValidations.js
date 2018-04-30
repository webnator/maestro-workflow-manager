'use strict';

let joiErrors;

exports.getJoiError = function (key, valid){
  return joiErrors[key].message + (valid || '') + '||' + joiErrors[key].code;
};

joiErrors = {
  createWorkflow_name: {
    code: 'WFVALSCHEMA100',
    message: 'name is required and must be a string'
  },
  createWorkflow_tasks_service: {
    code: 'WFVALSCHEMA101',
    message: 'tasks.service is required and must be a string'
  },
  createWorkflow_tasks_action: {
    code: 'WFVALSCHEMA102',
    message: 'tasks.action is required and must be a string'
  },
  createWorkflow_tasks_expectedResponse: {
    code: 'WFVALSCHEMA103',
    message: 'tasks.expectedResponse is required and must be a number'
  },
  createWorkflow_tasks_responseSchema: {
    code: 'WFVALSCHEMA104',
    message: 'tasks.responseSchema is required and must be a valid json schema object'
  },
  createWorkflow_tasks: {
    code: 'WFVALSCHEMA105',
    message: 'tasks is required and must be an array'
  },
  executeWorkflow_headers_id: {
    code:'WFVALSCHEMA106',
    message: 'X-flowId header is required and must be a string'
  },
  executeWorkflow_headers: {
    code:'WFVALSCHEMA107',
    message: 'headers in the request are required and must be an object'
  },
  continueWorkflow_uuid: {
    code:'WFVALSCHEMA108',
    message: 'processUuid is required and must be an uuid string'
  },
  continueWorkflow_name: {
    code:'WFVALSCHEMA109',
    message: 'processName is required and must be a valid string'
  }
};
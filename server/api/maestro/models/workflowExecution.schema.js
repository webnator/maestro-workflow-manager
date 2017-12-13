'use strict';

const Joi = require('joi');
const joiVals = require('./JoiValidations');

function WorkflowExecutionSchema() {
  return Joi.object().keys({
    headers: Joi.object().keys({
      'x-flowid': Joi.string().required().label(joiVals.getJoiError('executeWorkflow_headers_id')),
    }).required().unknown().label(joiVals.getJoiError('executeWorkflow_headers'))
  }).unknown();
}


module.exports = WorkflowExecutionSchema;

'use strict';

const Joi = require('joi');
const joiVals = require('./JoiValidations');

function WorkflowExecutionSchema() {
  return Joi.object().keys({
    'x-flowid': Joi.string().required().label(joiVals.getJoiError('executeWorkflow_headers_id')),
  }).required().unknown().label(joiVals.getJoiError('executeWorkflow_headers'));
}

module.exports = WorkflowExecutionSchema;

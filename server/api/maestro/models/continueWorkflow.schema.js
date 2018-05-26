'use strict';

const Joi = require('joi');
const joiVals = require('./JoiValidations');

function createWorkflowSchema() {
  return Joi.object().keys({
    processName: Joi.string().required().label(joiVals.getJoiError('continueWorkflow_name')),
    processUuid: Joi.string().guid().required().label(joiVals.getJoiError('continueWorkflow_uuid'))
  });
}


module.exports = createWorkflowSchema;

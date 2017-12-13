'use strict';

const Joi = require('joi');
const joiVals = require('./JoiValidations');

function createWorkflowSchema() {
  return Joi.object().keys({
    processUuid: Joi.string().guid().required().label(joiVals.getJoiError('continueWorkflow_uuid'))
  });
}


module.exports = createWorkflowSchema;

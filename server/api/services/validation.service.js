'use strict';

const Joi = require('joi');

function makeService(deps) {
  const {
    workflowResponses
  } = deps;
  return {
    async validateSchema(object, schema) {
      const validatedResult = await Joi.validate(object, schema);
      if (validatedResult.error) {
        workflowResponses.invalid_wf_object.message += ': ' + validatedResult.error.message;
        throw workflowResponses.invalid_wf_object;
      }
      return validatedResult.value;
    }
  }

}

module.exports = makeService;

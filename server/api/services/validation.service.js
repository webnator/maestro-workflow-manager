'use strict';

const Joi = require('joi');

function makeService() {
  return {
    validateSchema: (object, schema) => {
      return Joi.validate(object, schema);
    }
  }

}

module.exports = makeService;

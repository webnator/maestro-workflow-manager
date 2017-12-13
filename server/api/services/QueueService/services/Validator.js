'use strict';

const Joi = require('joi');
const ConfigModel = require('../models/ConfigObject');

exports.validateSchema = validateSchema;
exports.validateConfigSchema = validateConfigSchema;


function validateSchema(object, schema) {
  return Joi.validate(object, schema);
}

function validateConfigSchema(object) {
  return validateSchema(object, new ConfigModel());
}
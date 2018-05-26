'use strict';

const Joi = require('joi');
const joiVals = require('./JoiValidations');

const allowedTaskTypes = ['QUEUE','HTTP'];
const validHTTPMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const validFilterActions = ['deleteFields', 'renameFields', 'mergeFields', 'extractFields', 'deleteAllButFields'];

function createWorkflowSchema() {
  return Joi.object().keys({
    name: Joi.string().required().label(joiVals.getJoiError('createWorkflow_name')),
    tasks: Joi.array().items(Joi.object().keys({
      type: Joi.valid(allowedTaskTypes).required().label(joiVals.getJoiError('createWorkflow_tasks_type', allowedTaskTypes.join(', '))),
      executionInfo: Joi.alternatives().when('type', { is: 'QUEUE',
        then: Joi.object().keys({
          topic: Joi.string().required().label(joiVals.getJoiError('createWorkflow_tasks_queue_topic')),
          payload: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_payload')),
          params: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_params')),
          query: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_query')),
          headers: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_headers')),
        }),
        otherwise: Joi.object().keys({
          url: Joi.string().uri().required().label(joiVals.getJoiError('createWorkflow_tasks_http_url')),
          method: Joi.string().valid(validHTTPMethods).required().label(joiVals.getJoiError('createWorkflow_tasks_http_method', validHTTPMethods.join(', '))),
          payload: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_payload')),
          params: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_params')),
          query: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_query')),
          headers: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo_headers')),
        })
      }).required().label(joiVals.getJoiError('createWorkflow_tasks_executionInfo')),
      expectedResponse: Joi.number().required().label(joiVals.getJoiError('createWorkflow_tasks_expectedResponse')),
      responseSchema: Joi.object().label(joiVals.getJoiError('createWorkflow_tasks_responseSchema')),
      post_filters: Joi.array().items(Joi.object().keys({
        action: Joi.string().valid(validFilterActions).required().label(joiVals.getJoiError('createWorkflow_tasks_filters_action', validFilterActions.join(', '))),
        fields: Joi.array().min(1).required().label(joiVals.getJoiError('createWorkflow_tasks_filters_fields')),
        to: Joi.string().label(joiVals.getJoiError('createWorkflow_tasks_filters_to')),
        newName: Joi.string().label(joiVals.getJoiError('createWorkflow_tasks_filters_newName'))
      })).label(joiVals.getJoiError('createWorkflow_tasks_filters')),
      pre_filters: Joi.array().items(Joi.object().keys({
        action: Joi.string().valid(validFilterActions).required().label(joiVals.getJoiError('createWorkflow_tasks_filters_action', validFilterActions.join(', '))),
        fields: Joi.array().min(1).required().label(joiVals.getJoiError('createWorkflow_tasks_filters_fields')),
        to: Joi.string().label(joiVals.getJoiError('createWorkflow_tasks_filters_to')),
        newName: Joi.string().label(joiVals.getJoiError('createWorkflow_tasks_filters_newName'))
      })).label(joiVals.getJoiError('createWorkflow_tasks_prefilters'))
    })).required().label(joiVals.getJoiError('createWorkflow_tasks'))
  });
}


module.exports = createWorkflowSchema;

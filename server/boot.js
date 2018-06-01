'use strict';

require('dotenv').config();

const awilix = require('awilix');
const {createContainer, asValue, asFunction, asClass} = awilix;
const container = createContainer();

/** Init **/
const makeAppInit = require('./init');
const app = require('./app');
const config = require('./config');
const queueRoutes = require('./queueRoutes');

/** Libraries **/
const RequestLib = require('request-promise-native');
const mongodb = require('mongodb');
const pino = require('pino');
const Hapi = require('hapi');
const uuid = require('uuid');
const QueueLib = require('maestro-rabbit');
const jsonschema = require('jsonschema');
const resolvePath = require('object-resolve-path');

/** Services **/
const LogService = require('./api/services/log.service');
const ResponsesService = require('./api/services/responses.service');
const ValidationService = require('./api/services/validation.service');
const RequestService = require('./api/services/RequestService/index');
const QueueService = require('./api/services/queue.service');

/** Controllers **/
const WorkflowTemplateController = require('./api/maestro/controllers/workflowTemplate.controller');
const WorkflowExecutionController = require('./api/maestro/controllers/workflowExecution.controller');
const RequestHandlersController = require('./api/maestro/controllers/requestHandlers.controller');

/** Models **/
const processModel = require('./api/maestro/Workflow/models/process.model');

/** MANAGER **/
const workflowResponses = require('./api/maestro/Workflow/workflow.responses');
const TemplatesDAO = require('./api/maestro/Workflow/templates.dao');
const ProcessesDAO = require('./api/maestro/Workflow/processes.dao');
const WorkflowTemplateService = require('./api/maestro/Workflow/workflowTemplate.service');
const WorkflowExecutionService = require('./api/maestro/Workflow/workflowExecution.service');
const WorkflowExecutionUtils = require('./api/maestro/Workflow/workflowExecution.utils');
const TaskFilterService = require('./api/maestro/Workflow/taskFilters.service');


container.register({
  // Initial
  appInit: asFunction(makeAppInit).singleton(),
  config: asValue(config),
  app: asFunction(app).singleton(),
  queueRoutes: asValue(queueRoutes),

  // Libs
  logger: asValue(pino({level: 'debug'})),
  RequestLib: asValue(RequestLib),
  mongodb: asValue(mongodb),
  Hapi: asValue(Hapi),
  uuid: asValue(uuid),
  QueueLib: asValue(QueueLib),
  jsonschema: asValue(jsonschema),
  resolvePath: asValue(resolvePath),

  // constants
  REPOSITORY_NAME_TEMPLATES: asValue('templates'),
  REPOSITORY_NAME_PROCESSES: asValue('processes'),

  // services
  LogService: asFunction(LogService).singleton(),
  QueueService: asFunction(QueueService).singleton(),
  ResponsesService: asFunction(ResponsesService).singleton(),
  ValidationService: asFunction(ValidationService).singleton(),
  RequestService: asFunction(RequestService).singleton(),
  RepositoryFactory: asFunction(buildMakeFactory({
    REPOSITORY_NAME_TEMPLATES: 'TemplatesDAO',
    REPOSITORY_NAME_PROCESSES: 'ProcessesDAO'
  }, 'getRepository')).singleton(),

  // models
  processModel: asFunction(processModel).singleton(),

  // controllers
  WorkflowTemplateController: asFunction(WorkflowTemplateController).singleton(),
  WorkflowExecutionController: asFunction(WorkflowExecutionController).singleton(),
  RequestHandlersController: asFunction(RequestHandlersController).singleton(),

  // DAOs
  TemplatesDAO: asClass(TemplatesDAO).singleton(),
  ProcessesDAO: asClass(ProcessesDAO).singleton(),

  // Workflow
  WorkflowTemplateService: asFunction(WorkflowTemplateService).singleton(),
  WorkflowExecutionService: asFunction(WorkflowExecutionService).singleton(),
  WorkflowExecutionUtils: asFunction(WorkflowExecutionUtils).singleton(),
  TaskFilterService: asFunction(TaskFilterService).singleton(),
  workflowResponses: asFunction(workflowResponses).singleton()

});

function buildMakeFactory(config, methodGetterName = 'get') {
  return function makeFactory(container) {
    const mapOfValue = Object.keys(config).reduce((mapOfValue, propKey) => {
      const containerKey = container[propKey];
      const containerProp = container[config[propKey]];
      let obj;
      return Object.assign({}, mapOfValue, (obj = {}, obj[containerKey] = containerProp, obj));
    }, {});
    let obj;
    return (obj = {}, obj[methodGetterName] = (key) => {
      return mapOfValue[key];
    }, obj);
  };
}

module.exports = container;
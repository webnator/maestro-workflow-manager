'use strict';

require('dotenv').config();

const awilix = require('awilix');
const {createContainer, asValue, asFunction, asClass} = awilix;
const container = createContainer();

/** Init **/
const makeAppInit = require('./init');
const app = require('./app');
const config = require('./config');

/** Libraries **/
const RequestLib = require('request-promise-native');
const amqp = require('amqplib');
const mongodb = require('mongodb');
const pino = require('pino');
const Hapi = require('Hapi');
const uuid = require('uuid');

/** Services **/
const LogService = require('./api/services/log.service');
const ResponsesService = require('./api/services/responses.service');
const ValidationService = require('./api/services/validation.service');
const RequestService = require('./api/services/RequestService/index');
const QueueService = require('./api/services/QueueService/index');

/** Controllers **/
const WorkflowTemplateController = require('./api/maestro/controllers/workflowTemplate.controller');
const WorkflowExecutionController = require('./api/maestro/controllers/workflowExecution.controller');
const WorkflowStatsController = require('./api/maestro/controllers/workflowStats.controller');

/** MANAGER **/
const workflowResponses = require('./api/maestro/Workflow/workflow.responses');
const WorkflowEntity = require('./api/maestro/Workflow/workflow.entity');
const WorkflowProcessEntity = require('./api/maestro/Workflow/workflowProcess.entity');
const WorkflowStatsEntity = require('./api/maestro/Workflow/workflowStats.entity');
const TemplatesDAO = require('./api/maestro/Workflow/templates.dao');
const LogsDAO = require('./api/maestro/Workflow/logs.dao');
const StatsDAO = require('./api/maestro/Workflow/stats.dao');
const WorkflowTemplateService = require('./api/maestro/Workflow/workflowTemplate.service');
const WorkflowExecutionService = require('./api/maestro/Workflow/workflowExecution.service');
const WorkflowStatsService = require('./api/maestro/Workflow/workflowStats.service');


container.register({
  // Initial
  appInit: asFunction(makeAppInit).singleton(),
  config: asValue(config),
  app: asFunction(app).singleton(),

  // Libs
  logger: asValue(pino({level: 'debug'})),
  RequestLib: asValue(RequestLib),
  amqp: asValue(amqp),
  mongodb: asValue(mongodb),
  Hapi: asValue(Hapi),
  uuid: asValue(uuid),

  // constants
  REPOSITORY_NAME_TEMPLATES: asValue('templates'),
  REPOSITORY_NAME_LOGS: asValue('logs'),
  REPOSITORY_NAME_STATS: asValue('stats'),

  // services
  LogService: asFunction(LogService).singleton(),
  ResponsesService: asFunction(ResponsesService).singleton(),
  ValidationService: asFunction(ValidationService).singleton(),
  RequestService: asFunction(() => RequestService).singleton(),
  RepositoryFactory: asFunction(buildMakeFactory({
    REPOSITORY_NAME_TEMPLATES: 'TemplatesDAO',
    REPOSITORY_NAME_LOGS: 'LogsDAO',
    REPOSITORY_NAME_STATS: 'StatsDAO'
  }, 'getRepository')).singleton(),
  QueueService: asValue(QueueService),

  // controllers
  WorkflowTemplateController: asFunction(WorkflowTemplateController).singleton(),
  WorkflowExecutionController: asFunction(WorkflowExecutionController).singleton(),
  WorkflowStatsController: asFunction(WorkflowStatsController).singleton(),

  // DAOs
  TemplatesDAO: asClass(TemplatesDAO).singleton(),
  LogsDAO: asClass(LogsDAO).singleton(),
  StatsDAO: asClass(StatsDAO).singleton(),

  // Workflow
  WorkflowTemplateService: asFunction(WorkflowTemplateService).singleton(),
  WorkflowExecutionService: asFunction(WorkflowExecutionService).singleton(),
  WorkflowStatsService: asFunction(WorkflowStatsService).singleton(),
  workflowEntityFactory: asFunction(instantiateEntityWithDependencies(WorkflowEntity)).singleton(),
  workflowProcessEntityFactory: asFunction(instantiateEntityWithDependencies(WorkflowProcessEntity)).singleton(),
  workflowStatsFactory: asFunction(instantiateEntityWithDependencies(WorkflowStatsEntity)).singleton(),
  workflowResponses: asFunction(workflowResponses).singleton()

});

function instantiateEntityWithDependencies(Entity) {
  return (deps) => (...args) => new Entity(deps, ...args);
}

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
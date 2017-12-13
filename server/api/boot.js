'use strict';

const awilix = require('awilix');
const {createContainer, asValue, asFunction, asClass} = awilix;
const container = createContainer();

/** Init **/
const makeAppInit = require('./../init');

/** Libraries **/
const RequestLib = require('request-promise-native');
const amqp = require('amqplib');
const mongodb = require('mongodb');

/** Services **/
const LogService = require('./services/log.service');
const ResponsesService = require('./services/responses.service');
const ValidationService = require('./services/validation.service');
const RequestService = require('./services/RequestService');
const QueueService = require('./services/QueueService');

/** Controllers **/
const WorkflowTemplateController = require('./maestro/controllers/workflowTemplate.controller');
const WorkflowExecutionController = require('./maestro/controllers/workflowExecution.controller');
const WorkflowStatsController = require('./maestro/controllers/workflowStats.controller');

/** MANAGER **/
const workflowResponses = require('./maestro/Workflow/workflow.responses');
const WorkflowEntity = require('./maestro/Workflow/workflow.entity');
const WorkflowProcessEntity = require('./maestro/Workflow/workflowProcess.entity');
const WorkflowStatsEntity = require('./maestro/Workflow/workflowStats.entity');
const TemplatesDAO = require('./maestro/Workflow/templates.dao');
const LogsDAO = require('./maestro/Workflow/logs.dao');
const StatsDAO = require('./maestro/Workflow/stats.dao');
const WorkflowTemplateService = require('./maestro/Workflow/workflowTemplate.service');
const WorkflowExecutionService = require('./maestro/Workflow/workflowExecution.service');
const WorkflowStatsService = require('./maestro/Workflow/workflowStats.service');


container.register({
  // Initial
  appInit: asFunction(makeAppInit).singleton(),

  // Libs
  RequestLib: asValue(RequestLib),
  amqp: asValue(amqp),
  mongodb: asValue(mongodb),

  // constants
  REPOSITORY_NAME_TEMPLATES: asValue('templates'),
  REPOSITORY_NAME_LOGS: asValue('logs'),
  REPOSITORY_NAME_STATS: asValue('stats'),

  // services
  LogService: asFunction(instantiateEntityWithDependencies(LogService)).singleton(),
  ResponsesService: asFunction(ResponsesService).singleton(),
  ValidationService: asFunction(ValidationService).singleton(),
  RequestService: asFunction(() => RequestService).singleton(),
  RepositoryFactory: asFunction(buildMakeFactory({
    REPOSITORY_NAME_TEMPLATES: 'TemplatesDAO',
    REPOSITORY_NAME_LOGS: 'LogsDAO',
    REPOSITORY_NAME_STATS: 'StatsDAO'
  }, 'getRepository')).singleton(),
  QueueService: asFunction(QueueService).singleton(),

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
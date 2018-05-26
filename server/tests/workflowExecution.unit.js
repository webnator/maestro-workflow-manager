
const boot = require('./../boot.test');

const replyMock = require('./mocks/reply.mock');

const templatesDAOMock = boot.resolve('TemplatesDAO');
const processesDAOMock = boot.resolve('ProcessesDAO');
const queueMock = boot.resolve('QueueService');
const config = boot.resolve('config');

const logService = boot.resolve('LogService');

const executionController = boot.resolve('WorkflowExecutionController');

describe('workflow execution tests', () => {

  beforeEach(() => {
    templatesDAOMock.fetch.mockReset();
    processesDAOMock.save.mockReset();
    processesDAOMock.fetch.mockReset();
    processesDAOMock.updateProcess.mockReset();
    queueMock.publishHTTP.mockReset();
  });

  describe('executeFlow tests', () => {
    const mockRequest = {
      logger: logService.child({}),
      params: { flowId: 'flow-test' },
      headers: {},
      payload: { param1: 'test-param-1', param2: 'test-param-2' },
      traceId: 'trace-123'
    };
    it('should execute a correct workflow via HTTP', async () => {
      const httpSimpleWorkflow = require('./fixtures/workflowHttp.fixture');
      const httpSimpleProcess = require('./fixtures/processHttp.fixture');

      templatesDAOMock.fetch.mockReturnValueOnce(httpSimpleWorkflow);
      processesDAOMock.fetch.mockReturnValueOnce(httpSimpleProcess);

      await executionController.executeFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(templatesDAOMock.fetch).toHaveBeenCalled();
      expect(processesDAOMock.save).toHaveBeenCalled();
      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
      expect(queueMock.publishHTTP.mock.calls[0][0]).toBe(config.topics.handle_http);
      expect(processesDAOMock.updateProcess).toHaveBeenCalled();
      const queuePayload = queueMock.publishHTTP.mock.calls[0][1];
      const firstTask = httpSimpleProcess.tasks[0];
      expect(queuePayload.headers['x-flowinformtopic']).toEqual(config.topics.inform);
      expect(queuePayload.headers['x-flowprocessid']).toEqual(httpSimpleProcess.processUuid);
      expect(queuePayload.headers['x-flowtaskid']).toEqual(firstTask.taskUuid);
      expect(queuePayload.payload.request.method).toEqual(firstTask.executionInfo.method);
      expect(queuePayload.payload.request.url).toEqual(firstTask.executionInfo.url);
      expect(queuePayload.payload.request.payload).toEqual(mockRequest.payload);

    });

    it('should execute a correct workflow via QUEUE', async () => {
      const queueSimpleWorkflow = require('./fixtures/workflowQueue.fixture');
      const queueSimpleProcess = require('./fixtures/processQueue.fixture');

      templatesDAOMock.fetch.mockReturnValueOnce(queueSimpleWorkflow);
      processesDAOMock.fetch.mockReturnValueOnce(queueSimpleProcess);

      await executionController.executeFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(templatesDAOMock.fetch).toHaveBeenCalled();
      expect(processesDAOMock.save).toHaveBeenCalled();
      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
      const queuePayload = queueMock.publishHTTP.mock.calls[0][1];
      const firstTask = queueSimpleProcess.tasks[0];

      expect(queueMock.publishHTTP.mock.calls[0][0]).toBe(firstTask.executionInfo.topic);
      expect(processesDAOMock.updateProcess).toHaveBeenCalled();
      expect(queuePayload.headers['x-flowinformtopic']).toEqual(config.topics.inform);
      expect(queuePayload.headers['x-flowprocessid']).toEqual(queueSimpleProcess.processUuid);
      expect(queuePayload.headers['x-flowtaskid']).toEqual(firstTask.taskUuid);
      expect(queuePayload.payload).toEqual(mockRequest.payload);

    });

    it('if the themplate doesnt exist it should send it to the queue', async () => {
      templatesDAOMock.fetch.mockReturnValueOnce(null);

      await executionController.executeFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(400);
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
    });
  });

  describe('informTask tests', () => {
    let mockRequest;
    beforeEach(() => {
      mockRequest = {
        logger: logService.child({}),
        headers: {
          'x-flowprocessid': 'f89773f7-9377-472f-a9c2-f8aa6d285b4f',
          'x-flowtaskid': 'a048218a-449c-42b2-a41b-697faf6e3b24',
          'x-flowresponsecode': 201,
          'x-flowtaskfinishedon': new Date('2018-05-24'),
        },
        payload: { param1: 'test-param-1', param2: 'test-param-2' },
        traceId: 'trace-123'
      };

    });

    it('should store and continue with the next task in the process if the task status code is correct', async () => {
      const startedTwoStepProcess = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_started.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(startedTwoStepProcess);

      await executionController.informTask(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
      expect(queueMock.publishHTTP.mock.calls[0][0]).toBe(config.topics.continue);
      expect(queueMock.publishHTTP.mock.calls[0][1]).toEqual({ payload: { processUuid: mockRequest.headers['x-flowprocessid'] } });
      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(1);
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(startedTwoStepProcess.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(processUpdateObject.tasks[0].status[2].status).toEqual('COMPLETED');
      expect(processUpdateObject.tasks[0].response.payload).toEqual(mockRequest.payload);
      expect(processUpdateObject.tasks[0].receivedCode).toEqual(mockRequest.headers['x-flowresponsecode']);
    });

    it('should not continue with the next task in the process if the task status code is incorrect', async () => {
      mockRequest.headers['x-flowresponsecode'] = 502;
      const startedTwoStepProcess = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_started.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(startedTwoStepProcess);

      await executionController.informTask(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();
      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(2);
      //First call updates the task
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(startedTwoStepProcess.processUuid);
      const taskUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(taskUpdateObject.tasks[0].status[2].status).toEqual('FAILED');
      expect(taskUpdateObject.tasks[0].response.payload).toEqual(mockRequest.payload);
      expect(taskUpdateObject.tasks[0].receivedCode).toEqual(mockRequest.headers['x-flowresponsecode']);

      //Second call updates the process
      expect(processesDAOMock.updateProcess.mock.calls[1][1]).toEqual(startedTwoStepProcess.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[1][2];
      expect(processUpdateObject.status[1].status).toEqual('FAILED');
    });

  });

  describe('continueFlow tests', () => {
    let mockRequest;
    beforeEach(() => {
      mockRequest = {
        logger: logService.child({}),
        payload: { processUuid: 'f89773f7-9377-472f-a9c2-f8aa6d285b4f' }
      };
    });

    it('should execute the next task pending in the process', async () => {
      const startedTwoStepProcess = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_step1completed.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(startedTwoStepProcess);

      await executionController.continueFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
      expect(queueMock.publishHTTP.mock.calls[0][0]).toBe(config.topics.handle_http);
      const queuePayload = queueMock.publishHTTP.mock.calls[0][1];
      expect(queuePayload.headers['x-flowinformtopic']).toEqual(config.topics.inform);
      expect(queuePayload.headers['x-flowprocessid']).toEqual(startedTwoStepProcess.processUuid);
      expect(queuePayload.headers['x-flowtaskid']).toEqual(startedTwoStepProcess.tasks[1].taskUuid);
      expect(queuePayload.payload.request.method).toEqual(startedTwoStepProcess.tasks[1].executionInfo.method);
      expect(queuePayload.payload.request.url).toEqual(startedTwoStepProcess.tasks[1].executionInfo.url);
      expect(queuePayload.payload.request.payload).toEqual(startedTwoStepProcess.tasks[0].response);

      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(1);
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(startedTwoStepProcess.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(processUpdateObject.tasks[1].status[1].status).toEqual('STARTED');
      expect(processUpdateObject.tasks[1].request.payload).toEqual(startedTwoStepProcess.tasks[0].response);
    });

    it('should close the process if there are no more pending tasks', async () => {
      const startedTwoStepProcess = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_completed.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(startedTwoStepProcess);

      await executionController.continueFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();

      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(1);
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(startedTwoStepProcess.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(processUpdateObject.status[1].status).toEqual('COMPLETED');
    });

  });

  describe('resumeErroredFlow tests', () => {
    let mockRequest;
    beforeEach(() => {
      mockRequest = {
        logger: logService.child({}),
        payload: {
          processUuid: 'f89773f7-9377-472f-a9c2-f8aa6d285b4f',
          processName: 'test-2'
        }
      };
    });

    it('should resume the process from the failed step (2)', async () => {
      const erroredProcess = JSON.parse(JSON.stringify(require('./fixtures/workflow3Step_erroredStep2.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(erroredProcess);

      await executionController.resumeErroredFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).toHaveBeenCalledTimes(1);
      expect(queueMock.publishHTTP.mock.calls[0][0]).toBe(config.topics.handle_http);
      const queuePayload = queueMock.publishHTTP.mock.calls[0][1];
      expect(queuePayload.headers['x-flowinformtopic']).toEqual(config.topics.inform);
      expect(queuePayload.headers['x-flowprocessid']).toEqual(erroredProcess.processUuid);
      expect(queuePayload.headers['x-flowtaskid']).toEqual(erroredProcess.tasks[1].taskUuid);
      expect(queuePayload.payload.request.method).toEqual(erroredProcess.tasks[1].executionInfo.method);
      expect(queuePayload.payload.request.url).toEqual(erroredProcess.tasks[1].executionInfo.url);
      expect(queuePayload.payload.request.payload).toEqual(erroredProcess.tasks[0].response);

      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(1);
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(erroredProcess.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(processUpdateObject.status[2].status).toEqual('RESTARTED');
      expect(processUpdateObject.tasks[1].status[3].status).toEqual('RESTARTED');
      expect(processUpdateObject.tasks[1].request.payload).toEqual(erroredProcess.tasks[0].response);
    });

    it('should finish the process if all steps were correct', async () => {
      const completed = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_completed.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(completed);

      await executionController.resumeErroredFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(200);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();

      expect(processesDAOMock.updateProcess).toHaveBeenCalledTimes(1);
      expect(processesDAOMock.updateProcess.mock.calls[0][1]).toEqual(completed.processUuid);
      const processUpdateObject = processesDAOMock.updateProcess.mock.calls[0][2];
      expect(processUpdateObject.status[processUpdateObject.status.length - 2].status).toEqual('RESTARTED');
      expect(processUpdateObject.status[processUpdateObject.status.length - 1].status).toEqual('COMPLETED');
    });

    it('should fail if the process finished correctly', async () => {
      const completed = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_completed_correctly.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(completed);

      await executionController.resumeErroredFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(400);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();
    });

    it('should fail if the process is not found', async () => {
      processesDAOMock.fetch.mockReturnValueOnce(null);

      await executionController.resumeErroredFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(400);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();
    });

    it('should fail if the process name in the payload does not match the db name', async () => {
      mockRequest.payload.processName = 'test-3';
      const completed = JSON.parse(JSON.stringify(require('./fixtures/workflow2Step_completed.fixture')));

      processesDAOMock.fetch.mockReturnValueOnce(completed);

      await executionController.resumeErroredFlow(mockRequest, replyMock.reply);

      expect(replyMock.reply).toHaveBeenCalled();
      expect(replyMock.code).toHaveBeenCalledWith(400);

      expect(processesDAOMock.fetch).toHaveBeenCalled();
      expect(queueMock.publishHTTP).not.toHaveBeenCalled();
    });

  });
});
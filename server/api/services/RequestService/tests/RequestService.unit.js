'use strict';

const initRequestService = require('./../../RequestService').class;
const utils = require('./../../../../../tests/utils');

describe('RequestService', () => {
  let RequestService;
  const logData = utils.createMockData();
  let requestMock = utils.sendRequestMock();
  let deps = {
    sendRequest: requestMock
  };

  describe('request', () => {
    let reqObject = {
      baseUrl: 'http://test.com',
      url: '/inner/test/123',
      method: 'GET'
    };
    let myService;

    it('should make a request and execute the response function according to the code', () => {
      let response = 'TEST-GOOD';

      deps.sendRequest = utils.sendRequestMock({}, 200);
      RequestService = initRequestService(deps);
      myService = new RequestService(reqObject);

      let serviceReqObject = {
        logData,
        params: {
          url: '/inner/test-request',
          method: 'POST'
        },
        responses: {
          200: (res) => response
        },
        fallback: (err) => err
      };

      return myService.request(serviceReqObject).then((res) => {
        let callParams = deps.sendRequest.mock.calls[0][0];
        expect(callParams.reqData.method).toBe(serviceReqObject.params.method);
        expect(callParams.reqData.url).toBe(reqObject.baseUrl + serviceReqObject.params.url);
        expect(deps.sendRequest).toHaveBeenCalled();
        expect(res).toBe(response);
      });
    });

    it('should make a request and execute the fallback is the code is not found', () => {
      let errorResponse = 'TEST-GOOD';

      deps.sendRequest = utils.sendRequestMock({}, 400);
      RequestService = initRequestService(deps);
      myService = new RequestService(reqObject);

      let serviceReqObject = {
        logData,
        params: {
          url: '/inner/test-request',
          method: 'POST'
        },
        responses: {
          200: (res) => res
        },
        fallback: (err) => errorResponse
      };

      return myService.request(serviceReqObject).then((res) => {
        expect(res).toBe(errorResponse);
      });
    });

    it('should execute the fallback function if library fails', () => {
      let errorResponse = 'TEST-GOOD';

      deps.sendRequest = utils.sendRequestMock({}, 500, false);
      RequestService = initRequestService(deps);
      myService = new RequestService(reqObject);

      let serviceReqObject = {
        logData,
        params: {
          url: '/inner/test-request',
          method: 'POST'
        },
        responses: {
          200: (res) => res
        },
        fallback: (err) => errorResponse
      };

      return myService.request(serviceReqObject).then((res) => {
        expect(res).toBe(errorResponse);
      });
    });

    it('should execute the fallback function if theres an error with the response', () => {
      let errorResponse = 'TEST-GOOD';

      deps.sendRequest = utils.sendRequestMock({}, undefined, true);
      RequestService = initRequestService(deps);
      myService = new RequestService(reqObject);

      let serviceReqObject = {
        logData,
        params: {
          url: '/inner/test-request',
          method: 'POST'
        },
        responses: {
          200: (res) => res
        },
        fallback: (err) => errorResponse
      };

      return myService.request(serviceReqObject).then((res) => {
        expect(res).toBe(errorResponse);
      });
    });

  });


});
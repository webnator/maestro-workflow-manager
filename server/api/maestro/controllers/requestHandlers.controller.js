'use strict';


function makeService(deps) {
  const {
    ResponsesService,
    RequestService
  } = deps;

  return {
    /**
     * Makes an http request and returns the response received
     * FROM QUEUE - maestro.http
     * @param {Object} request - The http request object
     * @param {Function} reply - The reply callback
     */
    async handleHTTP(request, reply) {
      const { logger, payload } = request;
      logger.where(__filename, 'handleHTTP').accessing();

      let response = {};
      try {
        const reqObject = {
          url: payload.request.url,
          method: payload.request.method,
          payload: payload.request.payload,
          headers: payload.request.headers,
          params: payload.request.params,
          query: payload.request.query
        };
        console.log('-');
        const { body, statusCode } = await RequestService(logger, reqObject);
        response.body = body;
        response.statusCode = statusCode;

        logger.where(__filename, 'handleHTTP').info('HTTP request handled correctly');
      } catch (err) {
        response = ResponsesService.createGeneralError(err);
        logger.where(__filename, 'handleHTTP').warn({err}, 'HTTP handler failed');
      }
      logger.where(__filename, 'handleHTTP').end();
      return reply(response.body).code(response.statusCode);
    },

  };
}

module.exports = makeService;


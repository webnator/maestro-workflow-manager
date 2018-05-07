'use strict';


function makeService(deps) {
  const {
    RequestLib
  } = deps;

  return async (logger, { url, method, payload, headers, params, query }) => {
    logger.where(__filename, 'RequestService').accessing();
    try {
      const result = await RequestLib({
        method: method,
        url: url,
        body: payload || {},
        headers: headers || {},
        params: params || {},
        qs: query || {},
        json: true,
        resolveWithFullResponse: true
      });
      logger.where(__filename, 'RequestService').end();
      return result;
    } catch (err) {
      logger.where(__filename, 'RequestService').error({err}, 'Request failed');
      throw new Error(err);
    }
  };
}

module.exports = makeService;

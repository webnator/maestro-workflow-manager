'use strict';

class RequestService {
  constructor(deps, {baseUrl, url, method, body, headers, params, query}) {
    const {
      RequestLib
    } = deps;

    this._req = {
      baseUrl,
      url,
      method,
      body,
      headers: headers || {},
      params: params || {},
      query: query || {},
    };
    this.RequestLib = RequestLib;
  }

  async request({logData, params, responses, fallback}) {
    const req = RequestService.createRequestObject(Object.assign({}, this._req, params));

    try {
      const result = await this._makeRequest({object: req, logger: logData});
      if (result && result.response && result.response.statusCode) {
        const statusCode = result.response.statusCode;
        if (responses && responses[statusCode]) {
          return responses[statusCode](result.body);
        } else if (fallback) {
          return fallback(result.body);
        }
      }
    } catch (err) {
      return fallback(err);
    }
  }

  static createRequestObject(req) {
    return {
      method: req.method,
      url: (req.baseUrl || '') + (req.url || ''),
      json: req.body || req.json,
      headers: req.headers,
      params: req.params,
      qs: req.query,
    };
  }

  async _makeRequest({object}) {
    try {
      return this.RequestLib(object);
    } catch (err) {
      throw err;
    }
  }

}

module.exports = RequestService;

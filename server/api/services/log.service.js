'use strict';

const config = require('./../../config/environment');
const uuid = require('uuid');

class Log {
  constructor(deps, { request } = {}) {
    this.uuid = uuid;

    if (request) {
      this._setRequestInfo(request);
    }

    this._ts = new Date();
    this._setTrace(request);
    this._setMs(config.appName);
    this._setStyle(config.logStyle);

  }

  _setUser(uuid) {
    this._user = uuid;
  }
  _setStyle(style) {
    this._style = style || 'json';
  }

  _setMs(ms) {
    this._ms = ms;
  }

  _setRequestInfo(req) {
    this._request = {
      params: req.params,
      headers: req.headers,
      query: req.query,
      payload: req.payload,
    };
    this._endpoint = {
      path: req.path,
      method: req.method
    };
  }

  _setTrace(req) {
    if (req && req.headers && req.headers.from) {
      this._trace = req.headers.from + ':' + this.uuid.v4();
    } else {
      this._trace = this.uuid.v4();
    }
  }

  _getUser() {
    return this._user;
  }
  _getLogStyle() {
    return this._style;
  }

  getTraceUuid() {
    return this._trace;
  }

  method(file, method) {
    let log = {
      method: {
        file,
        method
      }
    };
    return {
      accessing: (message, extraData) => { log.method.status = 'ACCESSING'; this._writeLog(log, {message, extraData}); },
      success: (message, extraData) => { log.method.status = 'SUCCESS'; this._writeLog(log, {message, extraData}); },
      fail: (message, extraData) => { log.method.status = 'FAIL'; this._writeLog(log, {message, extraData}); },
      error: (message, extraData) => { log.method.status = 'ERROR'; this._writeLog(log, {message, extraData}); },
      info: (message, extraData) => { log.method.status = 'INFO'; this._writeLog(log, {message, extraData}); },
    };
  }

  finish(response, opts) {
    let log = {
      event: 'END',
      response: response,
      request: this._request,
    };

    if (opts && opts.noData === true) {
      log.response = this._modelResponse(log.response);
    }

    this._writeLog(log);
  }

  _modelResponse(response) {
    return {
      statusCode: response.statusCode,
      result: response.body.result
    };
  }

  start() {
    let log = {
      event: 'START',
      ts: this._ts,
      request: this._request,
    };
    this._writeLog(log);
  }

  _writeLog(log, extraData) {
    log = Object.assign(log, {
      ms: this._ms,
      endpoint: this._endpoint,
      trace: this._trace
    });
    log.ts = (log._ts || new Date()).toISOString();
    log.userUuid = this._getUser();
    if (extraData && (extraData.message || extraData.extraData)) {
      log.extraData = JSON.stringify(extraData);
    }

    this._printLog(log);
  }

  _printLog(log) {
    if (this._getLogStyle() === 'human') {
      let printString = '';
      if (log.event) {
        printString += log.event + ': ';
      }
      printString += log.ts + ' | ';
      printString += log.endpoint.method + ' ' + log.endpoint.path + ' | ';
      if (log.method) {
        printString += log.method.file + ' ' + log.method.method + ' | ' + log.method.status + ' | ';
      }
      if (log.extraData) {
        printString += 'Extra: ' + JSON.stringify(log.extraData) + ' | ';
      }
      if (log.request) {
        printString += 'Request: ' + JSON.stringify(log.request) + ' | ';
      }
      if (log.response) {
        printString += 'Response: ' + JSON.stringify(log.response) + ' | ';
      }

      console.log(printString);
    } else {
      console.log(JSON.stringify(log));
    }
  }
}

module.exports = Log;

'use strict';

function makeService(deps) {
  const {
    logger
  } = deps;

  const extraMethodsInLogger = [
    ['end', { step: 'end' }],
    ['checkpoint', { step: 'checkpoint'}],
    ['accessing', { step: 'accessing' }],
  ];

  function isObject(obj) {
    return obj === Object(obj);
  }

  const handlerLogger = {
    get(target, propertyName) {
      if (propertyName === 'child') {
        return (obj) => {
          return makeProxyLogger(target.child(obj));
        };
      }
      if (propertyName === 'where') {
        return function where(filename, method) {
          const where = { filename, method };
          return makeProxyLogger(target.child({ where }));
        };
      }
      const methodData = extraMethodsInLogger.find(([methodLogger]) => (methodLogger === propertyName));
      if (methodData) {
        const [, step] = methodData;
        return function newMethod(obj, ...args) {
          if (isObject(obj)) {
            target.debug(Object.assign({}, step, obj), ...args);
          } else {
            target.debug(step, obj, ...args);
          }
        };
      }
      if (typeof target[propertyName] === 'function') {
        return (...args) => target[propertyName](...args);
      }
      return target[propertyName];
    },
  };


  function makeProxyLogger(logObj) {
    return new Proxy(logObj, handlerLogger);
  }

  return makeProxyLogger(logger);
}


module.exports = makeService;

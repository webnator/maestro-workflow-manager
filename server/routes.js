'use strict';

/*** Main application routes */

const container = require('./api/boot');

exports.register = function(server, options, next) {
  require('./api/maestro')(server, container);
  next();
};

exports.register.attributes = {
  name: 'maestro-routes',
  version: '0.0.1'
};

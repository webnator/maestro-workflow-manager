'use strict';

/*** Main application routes */

const container = require('./boot');

exports.register = function(server, options, next) {
  require('./api/maestro/api.router')(server, container);
  next();
};

exports.register.attributes = {
  name: 'maestro-routes',
  version: '0.0.1'
};

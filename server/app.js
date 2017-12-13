'use strict';

const Hapi = require('hapi');
const config = require('./config/environment');

let server;
const setOptions = () => {
  const opts = {};
  opts.routes = {prefix: config.routes.prefix};
  return opts;
};

const init = () => {
  return new Promise((resolve, reject) => {
    // Create a server with a host and port
    server = new Hapi.Server();
    server.connection({port: config.port, routes: {cors: true}});

    // Register the server and start the application
    server.register([
        {register: require('./routes')}
      ],
      setOptions(),
      err => {
        if (err) {
          return reject(err);
        }
        server.start(err => {
          if (err) {
            return reject(err);
          }

          return resolve(server);
        });
      });
  });
};

const stopServer = () => {
  return new Promise((resolve, reject) => {
    server.stop(err => {
      if (err) {
        return reject(err);
      }
      console.log('Server stopped');
      return resolve(server);
    });
  });
};

exports.init = init;
exports.stopServer = stopServer;

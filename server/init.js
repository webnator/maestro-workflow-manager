'use strict';

const GlobalService = require('./api/services/global.service');

async function appInit(deps) {
  const {
    app,
    QueueService,
    mongodb,
    LogService,
    config,
    uuid,
    queueRoutes
  } = deps;
  const MongoClient = mongodb.MongoClient;

  try {
    const server = await app.init();

    server.ext('onRequest', (request, reply) => {
      const requestTraceId = request.traceId || uuid.v4();
      request.traceId = requestTraceId;
      request.logger = LogService.child({
        request: {
          payload: request.payload,
          query: request.query,
          headers: request.headers,
          params: request.params,
        },
        traceId: requestTraceId
      });
      return reply.continue();
    });

    // Connection URL
    let url = config.mongoSettings.url;

    // Use connect method to connect to the Server
    MongoClient.connect(url, (err, db) => {
      if (err) {
        console.error('Error connecting to mongo', err);
        throw err;
      }
      console.log('Connected correctly to DB');
      GlobalService.setConfigValue('db', db.db(config.mongoSettings.dbName));
    });

    await QueueService.init({ queueConfig: config.queueConfig, routes: queueRoutes });

    for (let queue in config.queues) {
      QueueService.queueManager.getQueue().createAndBindQueue(config.queues[queue]);
    }

    console.log('Server running at', server.info.uri);
  } catch (err) {
    console.log('Server start error',  err);
  }

}

module.exports = appInit;

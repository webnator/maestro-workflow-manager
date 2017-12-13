'use strict';

const config = require('./config/environment/');
const app = require('./app.js');
const queueRoutes = require('./queueRoutes');
const GlobalService = require('./api/services/global.service');

async function appInit(deps) {
  const {
    QueueService,
    mongodb,
    LogService
  } = deps;
  const MongoClient = mongodb.MongoClient;

  try {
    const server = await app.init();

    server.ext('onRequest', (request, reply) => {
      request.logger = LogService({request});
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

    QueueService.set({ queueConfig: config.queueConfig, routes: queueRoutes });
    const myQueue = QueueService.get();
    await myQueue.connect();
    for (let queue in config.queues) {
      myQueue.createAndBindQueue(config.queues[queue]);
    }

    console.log('Server running at', server.info.uri);
  } catch (err) {
    console.log('Server start error',  err);
  }

}

module.exports = appInit;

'use strict';

const config = require('./config');
let QueueRouter = require('./QueueRouter');

class QueueManager {
  constructor(logger, routeFile, queue) {
    this.logger = logger;
    // Sets up a new instance of the router
    this.router = new QueueRouter();
    // Sets the registered routes
    routeFile(this.router);
    this.queue = queue;
    this.registerConsumers();
  }

  registerConsumers() {
    let routes = this.router.getRoutes();
    this.logger.method(__filename, 'registerConsumers').accessing('Registering ' + routes.length + ' routes');
    for (let i = 0; i < routes.length; i++) {
      let route = routes[i];

      this.queue.consume(route.queue, route.topic, (message) => {
        let msgRequest;
        try {
          msgRequest = JSON.parse(message.content.toString());
          if (!msgRequest.headers) {
            msgRequest.headers = {};
          }
          msgRequest.method = config.methodName;
          msgRequest.path = route.topic;
        } catch(err) {
          msgRequest = message.content.toString();
        }

        let bindObject = {
          message: message,
          queue: this.queue
        };

        route.handler(msgRequest, QueueManager._replyFunction.bind(bindObject));
      });
    }
  }

  static _replyFunction(data) {
    return {
      code: (status) => {
        let request = JSON.parse(this.message.content.toString());
        if (request.headers && request.headers['x-flowinformtopic']) {

          let headers = {
            'x-flowprocessid': request.headers['x-flowprocessid'],
            'x-flowtaskid': request.headers['x-flowtaskid'],
            'x-flowresponsecode': status,
            'x-flowtaskfinishedon': new Date()
          };
          this.queue.publishHTTPRequest(request.headers['x-flowinformtopic'], data, headers);
        }
        switch(parseInt(status.toString().charAt(0))) {
          case 2: //2xx status codes
            this.logger.method(__filename, 'registerConsumers').success('QueueManager _replyFunction | Ok Acknowledged');
            this.queue.channel.ack(this.message);
            break;
          case 4: //4xx status codes
            this.logger.method(__filename, 'registerConsumers').error('QueueManager _replyFunction | 400 Sending to error queue');
            this.queue.publishToErrorQueue(JSON.parse(this.message.content.toString()), data);
            this.queue.ack(this.message);
            break;
          case 5: //5xx status codes
            let content = JSON.parse(this.message.content.toString());
            if (content.headers && content.headers['X-TimesResent'] !== undefined && !isNaN(parseInt(content.headers['X-TimesResent']))) {
              content.headers['X-TimesResent']++;
            } else {
              content.headers = content.headers || {};
              content.headers['X-TimesResent'] = 0;
            }

            this.queue.ack(this.message);

            setTimeout(() => {
              if (content.headers['X-TimesResent'] > this.queue.queueConfig.maxRetries) {
                this.logger.method(__filename, 'registerConsumers').error('QueueManager _replyFunction | 500 after max retries Sending to error queue');
                this.queue.publishToErrorQueue(content, data);
              } else {
                this.logger.method(__filename, 'registerConsumers').fail('QueueManager _replyFunction | 500 Re-queueing for the ' + content.headers['X-TimesResent'] + ' time' );
                this.queue.publish(this.message.fields.routingKey, content);
              }
            }, this.queue.queueConfig.timeBetweenRetries);

            break;
          default:
            this.logger.method(__filename, 'registerConsumers').error('QueueManager _replyFunction | Unknown response Sending to error queue');
            this.queue.publishToErrorQueue(JSON.parse(this.message.content.toString()), data);
            this.queue.ack(this.message);
            break;
        }
      }
    };
  }
}

module.exports = QueueManager;

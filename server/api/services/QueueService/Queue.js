'use strict';

const config = require('./config');
const Message = require('./Message');
const Manager = require('./QueueManager');

class Queue {
  constructor(deps, { queueConfig, routes }) {
    const {
      amqp,
      LogService
    } = deps;

    this.amqp = amqp;
    this.logger = LogService();

    this.connection = null;
    this.channel = null;

    this.queueConfig = queueConfig;
    this.amqpConnection = null;
    this.routes = routes;

    this.exchangeConfig = config.defaultExchangeConfig;
    this.queueConsumeConfig = config.defaultQueueConsumeConfig;
    this.publisherConfig = config.defaultPublisherConfig;
    this.retryConfig = config.retryPolicy;

    this.setConnectionString();
  }

  setConnectionString() {
    if (this.queueConfig) {
      this.amqpConnection = 'amqp://' + this.queueConfig.user + ':' + this.queueConfig.pass + '@' + this.queueConfig.host + ':' + this.queueConfig.port + '/' + this.queueConfig.vhost;
    } else {
      this.logger.method(__filename, 'setConnectionString').error('Queue Configuration not defined');
    }
  }

  async connect() {
    try {
      this.connection = await this.amqp.connect(this.amqpConnection);
      this.channel = await this.connection.createConfirmChannel();
      this._setConnectionErrorProcedure();
      if (this.routes) {
        this.manager = new Manager(this.logger, this.routes, this);
      }
      this.logger.method(__filename, 'connect').info('Queue connect - OK');
    } catch (err) {
      this.logger.method(__filename, 'connect').fail('Queue connect - KO Retrying - Error: ', err);
      setTimeout(async () => {
        await this.connect();
      }, this.queueConfig.reconnectionTime);
    }
  }

  _setConnectionErrorProcedure() {
    this.connection.on('exit', err => this.connect());
    this.connection.on('close', err => this.connect());
    this.connection.on('error', err => this.connect());
  }

  registerRoutes(routeFile) {
    this.routes = routeFile;
    this.manager = new Manager(this.logger, this.routes, this);
  }

  consume(queue, topic, callback) {
    if (!queue) {
      queue = topic;
    }
    this.channel.assertExchange(this.queueConfig.exchange, 'topic', this.exchangeConfig);
    this.channel.assertQueue(queue).then((res) => {
      this.channel.bindQueue(res.queue, this.queueConfig.exchange, topic);
      this.channel.consume(res.queue, callback, this.queueConsumeConfig);
    });
  }

  ack(msg) {
    if (this.channel) {
      this.channel.ack(msg);
    }
  }

  async publish(logger, {key, msg}) {
    for (let i = 0; i < this.retryConfig.retries; i++) {
      logger.info('Queue Publish | Accessing for the: ' + (i + 1) + ' time');
      let message = new Message(msg);
      this.channel.assertExchange(this.queueConfig.exchange, 'topic', this.exchangeConfig);
      try {
        const queue = await this.channel.assertQueue(key);
        this.channel.bindQueue(queue.queue, this.queueConfig.exchange, key);
        return this.channel.publish(
          this.queueConfig.exchange,
          key,
          message.getStringBufferBody(), this.publisherConfig, (err) => {
            if (err) {
              logger.info('Queue Publish | KO', err);
              return Promise.reject(err);
            } else {
              logger.info('Queue Publish | OK');
              return Promise.resolve();
            }
          });
      } catch (err) {
        await Queue._wait(this.retryConfig.time);
      }
    }

  }

  createAndBindQueue(queue, topic) {
    topic = topic || queue;
    this.channel.assertQueue(queue).then((res) => {
      this.channel.bindQueue(res.queue, this.queueConfig.exchange, topic);
    });
  }

  static _createHTTPRequest(payload, headers, query, params) {
    return {
      headers: headers || {},
      payload: payload || {},
      query: query || {},
      params: params || {}
    };
  }

  publishToErrorQueue(msg, responseData) {
    msg.response = responseData;
    this.channel.assertQueue(this.queueConfig.errorQueue).then((res) => {
      this.channel.bindQueue(res.queue, this.queueConfig.exchange, this.queueConfig.errorTopic);
      return this.publish(this.queueConfig.errorTopic, msg);
    });

  }

  static _wait(seconds) {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve();
      }, seconds);
    });
  }

  publishHTTPToTopic(logger, key, {payload, headers, query, params}) {
    let msg = Queue._createHTTPRequest(payload, headers, query, params);
    return this.publish(logger, {key, msg});
  }
}

module.exports = Queue;

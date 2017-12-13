'use strict';

class Message {
  constructor(body) {
    this.body = body;
  }

  getStringBufferBody() {
    return new Buffer(JSON.stringify(this.body));
  }

}

module.exports = Message;

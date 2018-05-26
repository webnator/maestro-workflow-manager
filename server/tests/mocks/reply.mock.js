'use strict';

const code = jest.fn();
const reply = jest.fn(() => ({ code }));


module.exports = {
  reply, code
};
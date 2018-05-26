'use strict';

const config = {};

module.exports = {
  getConfigValue: (param) => {
    if (config[param]) {
      return config[param];
    }
  },

  setConfigValue: (param, value) => {
    config[param] = value;
    return config[param];
  }
}

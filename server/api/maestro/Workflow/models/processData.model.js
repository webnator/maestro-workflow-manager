'use strict';

function ProcessDataModel(data) {
  // return Object.assign(data.payload, data.query, data.headers, data.params, {});
  return Object.assign(data.payload, {});
}

module.exports = ProcessDataModel;

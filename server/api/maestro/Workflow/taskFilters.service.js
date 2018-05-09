'use strict';

function makeService() {

  /**
   * Applies one filter to the data object
   * @param {Object} data - The object to apply the filter to
   * @param {Object} filter - The filter to be applied
   * @returns {Object}
   */
  function applyFilter(data, filter) {
    filter.fields.forEach(field => {
      const fieldName = field.name || field;
      if (data.payload.hasOwnProperty(fieldName)) {
        switch(filter.action) {
          case 'deleteFields':
            delete data.payload[field];
            break;
          case 'renameFields':
            data.payload[field.newName] = data.payload[field.name];
            delete data.payload[field.name];
            break;
          case 'mergeFields':
            if (typeof data.payload[field] === 'object' && !Array.isArray(data.payload[field])) {
              data.payload[filter.newName] = Object.assign({}, data.payload[filter.newName], data.payload[field]);
            } else {
              data.payload[filter.newName] = data.payload[filter.newName] || (Array.isArray(data.payload[field]) ? [] : '');
              data.payload[filter.newName] = data.payload[filter.newName].concat(data.payload[field]);
            }
            delete data.payload[field];
            break;
          case 'extractFields':
            data[filter.to] = Object.assign({}, data[filter.to], { [field]: data.payload[field]});
            break;
        }
      }
    });
    return data;
  }


  return {
    /**
     * Applies the provided array of filters to the data object
     * @param {Object} data - The object to apply the filters to
     * @param {Array} filters - The filters to be applied
     */
    applyFilters(data, filters) {
      const myData = JSON.parse(JSON.stringify(data));
      return filters.reduce((acc, val) => applyFilter(acc, val), myData);
    },
  };
}

module.exports = makeService;

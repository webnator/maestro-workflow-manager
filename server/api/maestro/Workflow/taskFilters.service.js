'use strict';

function makeService(deps) {
  const {
    resolvePath
  } = deps;

  /**
   * Resolves a string field with the path resolver
   * @param {Object} data - The object
   * @param {String} field - The string representation field to fetch
   */
  function resolveField(data, field) {
    try {
      return resolvePath(data, field);
    } catch (err) {
      return null;
    }
  }

  /**
   * Applies one filter to the data object
   * @param {Object} data - The object to apply the filter to
   * @param {Object} filter - The filter to be applied
   * @returns {Object}
   */
  function applyFilter(data, filter) {
    if (filter.action === 'deleteAllButFields') {
      data.payload = filter.fields.reduce((acc, val) => {
        if (data.payload[val]) { acc[val] = data.payload[val]; }
        return acc;
      }, {});
      return data;
    }

    filter.fields.forEach(field => {
      const fieldName = field.name || field;
      const fieldValue = resolveField(data.payload, fieldName);
      if (fieldValue) {
        switch(filter.action) {
          case 'deleteFields':
            delete data.payload[field];
            break;
          case 'renameFields':
            data.payload[field.newName] = fieldValue;
            delete data.payload[field.name];
            break;
          case 'mergeFields':
            if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
              data.payload[filter.newName] = Object.assign({}, data.payload[filter.newName], fieldValue);
            } else {
              data.payload[filter.newName] = data.payload[filter.newName] || (Array.isArray(fieldValue) ? [] : '');
              data.payload[filter.newName] = data.payload[filter.newName].concat(fieldValue);
            }
            delete data.payload[field];
            break;
          case 'extractFields':
            data[filter.to] = Object.assign({}, data[filter.to], { [field]: fieldValue});
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

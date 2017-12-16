'use strict';

const CODE_ENTITY_EXISTS = 11000;

const Responses = require('./dbServiceResponses');
const Global = require('./../global.service');

class DBService {

  constructor() {
    /*
     * Method from parent class to be implemented at all the children to know de collection name from the repository
     */
    if (this.getCollectionName === undefined) {
      throw new TypeError('Children class must implement method getCollectionName');
    }
  }

  /**
   * Method from parent class to get the collection
   * @public
   * @return {Object} result - The collection
   */
  getCollection() {
    let collectionName = this.getCollectionName();
    return Global.getConfigValue('db').collection(collectionName);
  }

  /**
   * Method from parent class to persist a entity
   * @public
   * @return {Object} data.payload - The entity
   */
  insert(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      let options = data.options || {};

      collection.insert(data.entity, options, (err, result) => {
        if (err) {
          if (err.code === CODE_ENTITY_EXISTS) {
            return reject(Responses.entity_exists);
          } else {
            return reject(Responses.internal_ddbb_error);
          }
        }
        data.result = result;
        return resolve(data);
      });
    });
  }

  /**
   * Method from parent class to persist some entities
   * @public
   */
  insertMany(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      let options = data.options || {};

      collection.insertMany(data.entities, options, (err, result) => {
        if (err) {
          if (err.code === 11000) {
            return reject(Responses.some_entity_exists);
          } else {
            return reject(Responses.internal_ddbb_error);
          }
        }
        data.result = result;
        return resolve(data);
      });
    });
  }

  /**
   * Method from parent class to retrieve a entity
   * @public
   * @return {Object} data.entity - The entity
   */
  findOne(data) {
    return new Promise((resolve, reject) => {
      const collection = this.getCollection();
      const options = data.options || {};

      collection.findOne(data.query, options, (err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result;
        return resolve(data);
      });
    });

  }

  /**
   * Method from parent class to retrieve a entity
   * @public
   * @return {Object} data.entity - The entity
   */
  find(data) {
    return new Promise((resolve, reject) => {
      const collection = this.getCollection();
      const options = data.options || {};

      collection.find(data.query, options).toArray((err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result;
        return resolve(data);
      });
    });

  }

  /**
   * Method from parent class to count the number of entities of a query
   * @public
   * @return {Object} data.entity - The entity
   */
  count(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      let options = data.options || {};

      collection.count(data.query, options, (err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result;
        return resolve(data);
      });
    });
  }

  /**
   * Method from parent class to find a modify a entity
   * @public
   * @return {Object} data - The container
   */
  findAndModify(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();

      let query = data.query;
      let update = data.entity;
      let options = data.options || {};
      let sort = data.sort || {};

      collection.findAndModify(query, sort, update, options, (err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result;
        return resolve(data);
      });
    });
  }

  /**
   * Method from parent class to update an entity
   * @public
   * @param {Object} data - The container object
   * @return {Promise}
   */
  update(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      let query = data.query;
      let update = data.entity;
      let options = data.options || {};

      collection.update(query, update, options, (err, response) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        } else {
          data.response = response;
          return resolve(data);
        }
      });
    });
  }

  /**
   * Method from parent class for removing an object
   * @public
   * @param {Object} data - The container object
   * @param {Object} data.query - The object with the mongo query
   * @param {Object} [data.options] - The object with the mongo options
   * @return {Promise}
   */
  remove(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      let options = {};
      if (!data.query || Object.keys(data.query).length === 0) {
        return reject(Responses.condition_not_found)
      }
      if (data.options) {
        options = data.options;
      }
      collection.remove(data.query, options, (err) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        return resolve(data);
      });
    });
  }


  /**
   * Method from parent class to retrieve a entity biggest by parameter
   * @public
   * @return {Object} data - The container object
   * @return {Object} data.query - The mongo query to fetch
   * @return {Object} data.fieldMax - The parameter to sort by
   */
  findMax(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      collection.find(data.query).sort(data.fieldMax).limit(1).toArray((err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result.pop();
        return resolve(data);
      });
    });
  }

  /**
   * Method from parent class to use aggregate method
   * @public
   * @param {Object} data - The container object
   * @param {Object} data.query - The object with the mongo query
   * @return {Promise}
   * @return {Object} data.result - The entity returned by the DDBB
   */
  aggregate(data) {
    return new Promise((resolve, reject) => {
      let collection = this.getCollection();
      collection.aggregate(data.query, (err, result) => {
        if (err) {
          return reject(Responses.internal_ddbb_error);
        }
        data.result = result;
        return resolve(data);
      });
    });
  }

}

module.exports = DBService;
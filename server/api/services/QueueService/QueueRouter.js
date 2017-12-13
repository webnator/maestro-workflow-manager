'use strict';

class QueueRouter {
  constructor () {
    this.routes = [];
  }

  /**
   * Registers a new route for handling queue messages
   * @param {Object} route - The route object
   * @param {Object} route.topic - The name of the topic to listen to
   * @param {Object} route.handler - The function to handle the message
   */
  route(route) {
    if (route.topic && route.handler) {
      this.routes.push(route);
    } else {
      console.error('QueueRouter route | KO Error while registering route: Wrong route object', route);
    }
  }

  /**
   * Obtains all routes
   * @returns {Array} - Array of route objects
   */
  getRoutes() {
    return this.routes;
  }

}

module.exports = QueueRouter;

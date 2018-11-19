const util = require('util');
const logger = global.logger;

class Scheduler {
  constructor() {
    util.log('Initializing Scheduler');
    this.stateMap = {};
  }

  getStateMap() {
    return this.stateMap;
  }

  generateStateMap() {
    // walk through the list of files in jobs array and create run map
    return {};
  }

  boot() {
    logger.info('Booting scheduler');
    return {};
  }
}

module.exports = Scheduler;
//export default Scheduler;

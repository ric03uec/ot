const util = require('util');
const _ = require('underscore');
const async = require('async');

const ConnectionAWS = require('./config/connAws.js');

class App {
  constructor() {
    logger.info('Initializing application');
    if (_.isEmpty(process.env.AWS_ACCESS_KEY)) {
      throw new Error('AWS Access key is required');
    }

    if (_.isEmpty(process.env.AWS_SECRET_KEY)) {
      throw new Error('AWS Secret key is required');
    }

    this.connection = new ConnectionAWS(
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY,
      process.env.AWS_REGION,
    );
  }

  run(done) {
    logger.info('Running application');
    const initOrder = [
      initConnection.bind(this),
    ];
    async.series(initOrder, (err) => {
      return done(err);
    });
  }
}

function initConnection(next) {
  this.connection.initialize();

  return next();
}

module.exports = App;

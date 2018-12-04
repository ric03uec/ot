const util = require('util');
const _ = require('underscore');
const async = require('async');

const ConnectionAWS = require('./config/connAws.js');
const ExcludedAMIs = require('./excludedAMIs.js');
const RemoteAMIs = require('./remoteAMIs.js');

class App {
  constructor() {
    logger.info('Initializing application');
    if (_.isEmpty(process.env.AWS_ACCESS_KEY)) {
      throw new Error('AWS Access key is required');
    }

    if (_.isEmpty(process.env.AWS_SECRET_KEY)) {
      throw new Error('AWS Secret key is required');
    }

    if (_.isEmpty(process.env.AWS_ACCOUNT_ID)) {
      throw new Error('AWS account ID is required');
    }

    this.connection = new ConnectionAWS(
      process.env.AWS_ACCESS_KEY,
      process.env.AWS_SECRET_KEY,
      process.env.AWS_REGION,
    );

    this.excludedAMIs = new ExcludedAMIs();
    this.remoteAMIs = new RemoteAMIs(
      this.connection, process.env.AWS_ACCOUNT_ID);
  }

  run(done) {
    logger.info('Running application');
    let flowData = {};
    const initOrder = [
      initConnection.bind(this, flowData),
      loadExcludedAMIs.bind(this, flowData),
      getRemoteAMIs.bind(this, flowData),
    ];
    async.series(initOrder, (err) => {
      return done(err);
    });
  }
}

function initConnection(flowData, next) {
  logger.info('Initializing connection');
  this.connection.initialize(err => {
    return next(err);
  });
}

function loadExcludedAMIs(flowData, next) {
  logger.info('Loading the list of excluded AMIs');
  this.excludedAMIs.loadAMIs((err, data) => {
    if (err) {
      return next(err);
    } else {
      flowData.excludedAMIs = data;
      return next();
    }
  });
}

function getRemoteAMIs(flowData, next) {
  logger.info('Getting all the AMIs from AWS');
  this.remoteAMIs.getAll((err, data) => {
    if (err) {
      return next(err);
    } else {
      flowData.remoteAMIs = data;
      return next();
    }
  });
}

module.exports = App;

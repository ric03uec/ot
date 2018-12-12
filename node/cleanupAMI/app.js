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
    const initFlow = [
      initConnection.bind(this, flowData),
      loadExcludedAMIs.bind(this, flowData),
      getRemoteAMIs.bind(this, flowData),
      //filterExcludedAMIs.bind(this, flowData),
      //removeUnusedAMIs.bind(this, flowData),
      getSnapshots.bind(this, flowData),
      filterExcludedSnapshots.bind(this, flowData),
      removeUnusedSnapshots.bind(this, flowData),
    ];
    async.series(initFlow, (err) => {
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

function filterExcludedAMIs(flowData, next) {
  logger.info('Filtering out the excluded AMIs');
  logger.info(util.format('\t Total AMIs: %s', _.size(flowData.remoteAMIs)));
  logger.info(util.format('\t Excluded AMIs: %s', _.size(flowData.excludedAMIs)));

  flowData.toRemoveAMIs = [];
  _.each(flowData.remoteAMIs,
    (remoteAMI) => {
      if (!_.contains(flowData.excludedAMIs, remoteAMI.ImageId)) {
        flowData.toRemoveAMIs = flowData.toRemoveAMIs.concat(remoteAMI);
      }
    }
  );

  //let amisInDb = [];
  //let mappedRemoteAMIs = _.map(flowData.remoteAMIs, (remoteAMI) => {
  //  return remoteAMI.ImageId;
  //});

  //_.each(flowData.excludedAMIs,
  //  (excludedAMI) => {
  //    if (!_.contains(mappedRemoteAMIs, excludedAMI)) {
  //      amisInDb = amisInDb.concat(excludedAMI);
  //    }
  //  }
  //);

  logger.info(util.format('\t AMIs to remove: %s', _.size(flowData.toRemoveAMIs)));

  setImmediate(() => {
    return next();
  });
}

function removeUnusedAMIs(flowData, next) {
  logger.info('Removing unused AMIs');

  this.remoteAMIs.removeAMIs(flowData.toRemoveAMIs,
    (err) => {
      return next(err);
    }
  );
}

function getSnapshots(flowData, next) {
  logger.info('Getting all snapshots owned by the account');

  this.remoteAMIs.getSnapshots((err, data) => {
    if (err) {
      return next(err);
    } else {
      flowData.snapshots = data;
    }

    return next();
  });
}

function filterExcludedSnapshots(flowData, next) {
  logger.info('Filtering out excluded Snapshots');
  let excludedSnapshots = _.map(flowData.remoteAMIs,
    (remoteAMI) => {
      return remoteAMI.SnapshotId;
    }
  );
  logger.info(util.format('\t Total Snapshots: %s', _.size(flowData.snapshots)));
  logger.info(util.format('\t Excluded Snapshots: %s', _.size(excludedSnapshots)));

  flowData.snapshots = _.without(flowData.snapshots, ...excludedSnapshots);

  //flowData.snapshots = flowData.snapshots.slice(0, 3);

  logger.info(util.format('\t Snapshots to remove: %s', _.size(flowData.snapshots)));

  return next();
}

function removeUnusedSnapshots(flowData, next) {
  logger.info('Removing unused Snapshots');

  this.remoteAMIs.removeSnapshots(flowData.snapshots,
    (err) => {
      return next(err);
    }
  );
}

module.exports = App;

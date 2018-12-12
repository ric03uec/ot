const util = require('util');
const _ = require('underscore');
const async = require('async');

const ConnectionGCP = require('./config/connGCP.js');
const ExcludedImages = require('./excludedImages.js');
const RemoteImages = require('./remoteImages.js');

class App {
  constructor() {
    logger.info('Initializing application');
    //if (_.isEmpty(process.env.PROJECT_ID)) {
    //  throw Error('Project ID cannot be empty');
    //}

    //if (_.isEmpty(process.env.GCP_KEY_FILE)) {
    //  throw Error('Key File Name required');
    //}

    //this.connection = new ConnectionGCP(
    //  process.env.PROJECT_ID,
    //  process.env.GCP_KEY_FILE,
    //);

    //this.excludedImages = new ExcludedImages();
    //this.remoteImages = new RemoteImages(this.connection);
  }

  run(done) {
    //logger.info('Running application');
    //let flowData = {};
    //const initFlow = [
    //  initConnection.bind(this, flowData),
    //  //loadExcludedImages.bind(this, flowData),
    //  //getRemoteImages.bind(this, flowData),
    //  //filterExcludedAMIs.bind(this, flowData),
    //  //removeUnusedAMIs.bind(this, flowData),
    //];
    // async.series(initFlow, (err) => {
    //   return done(err);
    // });
    //
    logger.info('Initializing connection');

    const {Storage} = require('@google-cloud/storage');

    // Your Google Cloud Platform project ID
    const projectId = 'shippable-machine-images';

    // Instantiates a client
    const storage = new Storage({
      projectId: projectId,
    });

    // The name for the new bucket
    const bucketName = 'my-new-bucket-ric03uc-foo-moo-boo';

    // Creates the new bucket
    storage
      .createBucket(bucketName)
      .then(() => {
        console.log(`Bucket ${bucketName} created.`);
      })
      .catch(err => {
        console.error('ERROR:', err);
      });

  }
}

function initConnection(flowData, next) {

    // logger.info(util.inspect(process.env))
    // const projectId = 'shippable-machine-images';
    // const storage = new Storage({
    //   projectId: projectId,
    // });

    // const bucketName = 'my-new-bucket-ric03uec-foo-bar-goo-moo';

    // storage
    // .createBucket(bucketName)
    // .then((results) => {
    //   logger.info(util.inspect(results));
    //   return next();
    // })
    // .catch((err) => {
    //   return next(err);
    // });

//  this.connection.initialize(err => {
//    return next(err);
//  });
}

function loadExcludedImages(flowData, next) {
  logger.info('Loading the list of excluded AMIs');
  this.excludedImages.loadImages((err, data) => {
    if (err) {
      return next(err);
    } else {
      flowData.excludedAMIs = data;
      return next();
    }
  });
}

function getRemoteImages(flowData, next) {
  logger.info('Getting all the Images from GCP');
  this.remoteImages.getAll((err, data) => {
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

module.exports = App;

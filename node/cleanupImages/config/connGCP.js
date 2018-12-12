/* global _ */

const util = require('util');
const _ = require('underscore');
//const Compute = require('@google-cloud/compute');
const {Storage} = require('@google-cloud/storage');

class ConnGCP {
  constructor(projectId, keyFilename, zone) {
    logger.info('Initializing GCP connection');
    this.connection = null;
    //this.zone = zone || 'us-east4-a';
    this.projectId = projectId;
    this.keyFilename = keyFilename;

    if (_.isEmpty(this.projectId)) {
      throw Error('Project ID cannot be empty');
    }

    if (_.isEmpty(this.keyFilename)) {
      throw Error('Key File Name required');
    }

    //TODO: check for existence of file  in path
    logger.info('GCP access credentials present');
  }

  initialize(done) {
    logger.info('Initializing GCP connection');
   // const config = {
   //   projectId: this.projectId,
   //   keyFilename: this.keyFilename,
   // };

    //logger.info(util.inspect(config))
    //const storage = new Storage({
    //  projectId: 'shippable-machine-images',
    //  keyFilename: '/home/devashish/.ssh/gcp/shippable-machine-images-trailhead-compute-admin-ed04e2acc9c0.json',
    //});
    //this.connection = new Compute(config);
    //this.connection = new Compute(config);

    //let params = {};
  //  this.connection.getImages(params, (err, data) => {
  //      if (err) {
  //        return done(err);
  //      }
  //      logger.info(util.inspect(data));

  //      logger.info('Fetched all Images. Total count: ' + _.size(data));
  //      return done(null, data);
  //    }
  //  );
    //
    ///.getImages()

    logger.info(util.inspect(process.env))
    const projectId = 'shippable-machine-images';
    const storage = new Storage({
      projectId: projectId,
    });

    const bucketName = 'my-new-bucket-ric03uec-foo-bar-goo-moo';

    storage
    .createBucket(bucketName)
    .then((results) => {
      logger.info(util.inspect(results));
      return done();
    })
    .catch((err) => {
      return done(err);
    });

  //  setImmediate(() => {
  //    logger.info('Successfully Initialized GCP connection');
  //    return done();
  //  });
  }
}

module.exports = ConnGCP;

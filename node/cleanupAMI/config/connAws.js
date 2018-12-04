/* global _ */
/* global Exception */

const util = require('util');
const _ = require('underscore');
const AWS = require('aws-sdk');

class ConnAWS {
  constructor(accessKey, secretKey, region) {
    logger.info('Initializing AWS connection');
    this.ec2 = null;
    this.apiVersion = '2016-11-15';
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.region = region || 'us-east-1';

    if (_.isEmpty(this.accessKey)) {
      throw Exception('Access key cannot be empty');
    }

    if (_.isEmpty(this.secretKey)) {
      throw Exception('Secret key cannot be empty');
    }

    logger.info('AWS access credentials present');
  }

  initialize(done) {
    logger.info('Initializing AWS connection');
    logger.info(this.region);
    const config = {
      apiVersion: this.apiVersion,
      accessKeyId: this.accessKey,
      secretAccessKey: this.secretKey,
      region: this.region,
    };
    this.ec2 = new AWS.EC2(config);

    setImmediate(() => {
      return done();
    });
  }

  validatePermsMetrics() {
    // check if the keys have permissions to access metrics
    logger.info('Validating permission for keys');
    logger.info(this.region);
  }
}

module.exports = ConnAWS;

/* global _ */
/* global Exception */

const util = require('util');
const _ = require('underscore');
const AWS = require('aws-sdk');

const logger = global.logger;

class ConnAWS {
  constructor(accessKey, secretKey, region) {
    util.log('Initializing AWS connection');
    this.connection = null;
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

  initialize() {
    util.log('Initializing AWS connection');
    util.log(this.region);
    const config = {
      apiVersion: this.apiVersion,
      accessKeyId: this.accessKey,
      secretAccessKey: this.secretKey,
      region: this.region,
    };
    this.connection = {};
    this.connection.ec2 = new AWS.EC2(config);
    this.connection.cloudwatch = new AWS.CloudWatch(config);
    this.connection.s3 = new AWS.S3(config);
  }

  validatePermsMetrics() {
    // check if the keys have permissions to access metrics
    util.log('Validating permission for keys');
    util.log(this.region);
  }
}

module.exports = ConnAWS;

/* global _ */
/* global Exception */

const util = require('util');
const _ = require('underscore');
const AWS = require('aws-sdk');

class ConnAWS {
  constructor(accessKey, secretKey, region) {
    util.log('Initializing AWS connection');
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

    util.log('AWS access credentials present');
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
    this.ec2 = new AWS.EC2(config);
  }

  validatePermsMetrics() {
    // check if the keys have permissions to access metrics
    util.log('Validating permission for keys');
    util.log(this.region);
  }
}

module.exports = ConnAWS;

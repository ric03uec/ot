const _ = require('underscore');
const os = require('os');
const util = require('util');
const async = require('async');
const fs = require('fs');
const path = require('path');
const Json2csvParser = require('json2csv').Parser;

class DeleteBuckets {
	constructor(query, connection) {
    this.connection = connection;
    // number of times the data will be fetched
    // total number of secs over which data is collected is
    // execCount X interval
    this.execCount = 10000;

    // run the loop every 10 minutes
    this.intervalMS = 600000;

    this.resultsDir = '/stats';

    this.query = query;
    this.metrics = {};
  }

  parseQuery() {
    util.log('Parsing query');
    util.log(this.query);
  }

  run() {
    util.log('Calculating bucket size');
    execute(this);
  }
}

function _getBuckets(context, results, next) {
  util.log('Getting total buckets from s3');

  const bucketQuery = {};
  const immutableBuckets = [
    'shippable-production-40798674-edd9-4812-8382-073338ed18aa',
  ];
  let bucketList = [];
  context.connection.connection.s3.listBuckets(bucketQuery,
    (err, data) => {
      if (err) {
        util.error(err);
        return next(err);
      } else {
        util.log('received bucket list ');
        if (_.isEmpty(data.Buckets)) {
          util.error('No buckets available');
          return next(true);
        }
        _.each(data.Buckets,
          (bucket) => {
            if (_.size(bucket.Name) !== 24 || _.contains(immutableBuckets, bucket.Name)) {
              util.log('SKipping ..... : ' + util.inspect(bucket.Name));
            } else {
              const bucketEntry = {
                name: bucket.Name,
              };
              bucketList = [...bucketList, bucketEntry];
            }
          }
        );

        results.bucketsToDelete = bucketList;

        util.log('Buckets to be deleted: ' + util.inspect(bucketList.length));
        return next();
      }
    }
  );
}

function _deleteBuckets(context, results, next) {
  util.log('Deleting buckets')

  function _getObjects(bucket, innerNext) {
    util.log('Getting objects for bucket: ' + bucket.name);

    const listObjectQuery = {
      Bucket: bucket.name,
    };

    context.connection.connection.s3.listObjectsV2(listObjectQuery,
      (err, data) => {
        if (err) {
          util.error(err);
          return innerNext(err);
        } else {
          //util.log('received bucket objects' + util.inspect(data));
          if (_.isEmpty(data.Contents)) {
            util.error('No objects avaialble');
            return innerNext();
          }
          util.log('Total objects for bucket: ' + data.Contents.length);
          //bucket.objects = data.Contents;

          bucket.objects = _.map(data.Contents,
            (bucketObject) => {
              return {
                Key: bucketObject.Key,
              };
            }
          );

          return innerNext();
        }
      }
    );
  }

  function _deleteObjects(bucket, innerNext) {
    util.log('Deleting bucket objects: ' + bucket.name);

    if (_.isEmpty(bucket.objects)) {
      return innerNext();
    }

    const deleteParams = {
      Bucket: bucket.name,
      Delete: {
        Objects: bucket.objects,
      },
    };

    context.connection.connection.s3.deleteObjects(deleteParams,
      (err, data) => {
        if (err) {
          util.error(err);
          return innerNext(err);
        } else {
          util.log(util.inspect(data));
          util.log("Successfully deleted objects for bucket: " + bucket.name);
          return innerNext();
        }
      }
    );
  }

  function _deleteBucket(bucket, innerNext) {
    util.log('Deleting bucket : ' + bucket.name);

    const deleteQuery = {
      Bucket: bucket.name,
    };

    context.connection.connection.s3.deleteBucket(deleteQuery,
      (err, data) => {
        if (err) {
          util.err(err);
          return innerNext(err);
        } else {
          util.log("Successfully deleted bucket: " + bucket.name);
          return innerNext();
        }
      }
    );
  }

  async.eachSeries(
    results.bucketsToDelete,
    async.applyEachSeries([_getObjects, _deleteObjects, _deleteBucket]),
    (err) => {
      if (err) {
        util.error(err);
        return next(err);
      } else {
        util.log('-------- Deleted all buckets  ------');
        // util.log(util.inspect(results.runningInstances, {depth: 5}));
        return next();
      }
    }
  );
}

function _writeResults(context, results, next) {
  util.log('Writing results to file');
  return next();

  util.log(util.inspect(results.subscriptionStats));

  const resultsOut = path.join(context.resultsDir, 'network.csv');
  // const fields = ['subscriptionId', 'time', 'networkIn', 'networkOut'];

  // const parser = new Json2csvParser({ fields });
  const parser = new Json2csvParser();
  let csvOutput = parser.parse(results.subscriptionStats);
  csvOutput = util.format('%s%s%s', os.EOL, csvOutput, os.EOL);

  util.log(util.inspect(csvOutput));
  fs.appendFile(resultsOut, csvOutput,
    (err) => {
      if (err) {
        util.error(err);
        return next(err);
      } else {
        util.log('output written to file');
        return next();
      }
    }
  );
}

function execute(context) {
	const results = {};

  async.series([
    _getBuckets.bind(null, context, results),
    _deleteBuckets.bind(null, context, results),
    _writeResults.bind(null, context, results),
  ], (err) => {
    if (err) {
      util.error(util.inspect(err));
    } else {
      context.execCount -= 1;
      context.metrics = results.metrics;
    }
  });
}

module.exports = DeleteBuckets;

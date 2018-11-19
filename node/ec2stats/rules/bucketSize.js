const os = require('os');
const util = require('util');
const async = require('async');
const fs = require('fs');
const path = require('path');
const Json2csvParser = require('json2csv').Parser;

class BucketSize {
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
    this.timer = null;
  }

  parseQuery() {
    util.log('Parsing query');
    util.log(this.query);
  }

  run() {
    util.log('Calculating bucket size');
    fetchResults(this);
    this.timer = setInterval(fetchResults, this.intervalMS, this);
  }
}

function _writeResults(context, results, next) {
  util.log('Writing results to file');
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

function fetchResults(context) {
	const results = {};

  async.series([
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

module.exports = BucketSize;

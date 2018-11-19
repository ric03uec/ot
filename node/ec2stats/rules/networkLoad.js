const os = require('os');
const util = require('util');
const _ = require('underscore');
const async = require('async');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Json2csvParser = require('json2csv').Parser;

class NetworkLoad {
  constructor(query, connection) {
    this.connection = connection;
    // number of times the data will be fetched
    // total number of secs over which data is collected is
    // execCount X interval
    this.execCount = 10000;

    // run the loop every 10 minutes
    this.intervalMS = 600000;

    this.maxDataPoints = 5;

    // get sum of all network traffic over a period of last 10 minutes
    this.periodSec = 600;

    // collecting at most 5 data points posted in last 10 minutes
    // since cloudwatch basic monitoring posts stats every 5 minutes for
    // network, this should be OK
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
    util.log('Calculating network load');
    fetchResults(this);
    this.timer = setInterval(fetchResults, this.intervalMS, this);
  }
}

function _fetchRunningInstances(context, results, next) {
  util.log('Getting instance state');

  let runningInstances = [];
  const instanceQuery = {
    Filters: [
      {
        Name: 'instance-state-name',
        Values: ['running'],
      },
    ],
    MaxResults: 50,
  };
  context.connection.connection.ec2.describeInstances(instanceQuery,
    (err, data) => {
      if (err) {
        util.error(err);
      } else {
        util.log('------------ Got instances --------------');
        //util.log(util.inspect(data.Reservations[0], {depth: 5}));
        _.each(data.Reservations, (entry) => {
          if (!_.isEmpty(entry.Instances)) {
            _.each(entry.Instances, (instance) => {
              const instanceInfo = {
                id: instance.InstanceId,
                type: instance.InstanceType,
                ami: instance.ImageId,
                startTime: instance.LaunchTime,
              };
              runningInstances = [...runningInstances, instanceInfo];
            });
          }
        });
        util.log('Running instance count --------- : ' + runningInstances.length);
        //util.log(util.inspect(runningInstances));
        results.runningInstances = runningInstances;

        return next();
      }
    });
}

function _getNetworkMetrics(context, results, next) {
  util.log('Fetching network in usage for instances');


  function _getInstanceMetrics(instance, innerNext) {
    util.log('Fetching network metrics for instance: ' + instance.id);

    const startTime = moment(results.now).subtract(context.periodSec, 'seconds');
    const endTime = moment(results.now);

    // api docs: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricStatistics.html
    // TODO: use recursion to get all the data points in a given interval
    const metricQuery = {
      StartTime: startTime.toISOString(),
      EndTime: endTime.toISOString(),
      MaxDatapoints: context.maxDataPoints,
      ScanBy: 'TimestampDescending',
      MetricDataQueries: [
        {
          Id: 'instance_network_IN',
          MetricStat: {
            Metric: {
              Dimensions: [
                {
                  Name: 'InstanceId',
                  Value: instance.id,
                },
              ],
              MetricName: 'NetworkIn',
              Namespace: 'AWS/EC2',
            },
            Period: context.periodSec,
            Stat: 'Sum',
            Unit: 'Bytes',
          },
        },
        {
          Id: 'instance_network_OUT',
          MetricStat: {
            Metric: {
              Dimensions: [
                {
                  Name: 'InstanceId',
                  Value: instance.id,
                },
              ],
              MetricName: 'NetworkOut',
              Namespace: 'AWS/EC2',
            },
            Period: context.periodSec,
            Stat: 'Sum',
            Unit: 'Bytes',
          },
        },
      ],
    };

    context.connection.connection.cloudwatch.getMetricData(metricQuery,
      (err, data) => {
        if (err) {
          util.error(err);
          return innerNext(err);
        } else {
          util.log('----------fetched metric data --------------');
          util.log(util.inspect(data, {depth: 10}));
          if (_.isEmpty(instance.metrics)) {
            instance.metrics = {
              networkIn: [],
              networkOut: [],
            };
          }
          const networkInResults = _.find(data.MetricDataResults,
            (metric) => {
              return metric.Label === 'NetworkIn';
            }
          );
          if (!_.isEmpty(networkInResults.Values)) {
            const networkInEntry = {
              'time' : networkInResults.Timestamps[0],
              'value' : networkInResults.Values[0],
            };
            instance.metrics.networkIn =
              [...instance.metrics.networkIn, networkInEntry]
          }

          const networkOutResults = _.find(data.MetricDataResults,
            (metric) => {
              return metric.Label === 'NetworkOut';
            });
          if (!_.isEmpty(networkOutResults.Values)) {
            networkOutEntry = {
              'time' : networkOutResults.Timestamps[0],
              'value' : networkOutResults.Values[0],
            };
            instance.metrics.networkOut =
              [...instance.metrics.networkOut, networkOutEntry];
          }

          return innerNext();
        }
      }
    );
  }

  async.eachSeries(results.runningInstances, _getInstanceMetrics,
    (err) => {
      if (err) {
        util.error(err);
        return next(err);
      } else {
        util.log('-------- aggregated network stats for all instances ------');
        // util.log(util.inspect(results.runningInstances, {depth: 5}));
        return next();
      }
    }
  );
}

function _createSubsInstancesMap(context, results, next) {
  util.log('Generating instances-subscription mapping');

  const tagQuery = {};
  context.connection.connection.ec2.describeTags(
    tagQuery, (err, data) => {
      if (err) {
        util.error(util.inspect(err));
        return next(err);
      } else {
        util.log('------------- Got instance tags ----------------');
        if (!_.isEmpty(data.Tags)) {
          util.log('Found instance tags');
          _.each(data.Tags,
            (tag) => {
              if (tag.Key === 'Subscription Id') {
                const subscriptionId = tag.Value;
                if (!_.has(results.metrics, subscriptionId)) {
                  results.metrics[subscriptionId] = [];
                }

                const instanceId = tag.ResourceId;
                const instance = _.find(results.runningInstances,
                  (runningInstance) => {
                    // find a running instnace for the subscription
                    return runningInstance.id === instanceId;
                  }
                );

                if (!_.isEmpty(instance)) {
                  instance.subscriptionId = subscriptionId;
                  results.metrics[subscriptionId] =
                    [...results.metrics[subscriptionId], instance];
                }
              }
            }
          );
          // util.log(util.inspect(results.metrics));
          util.log('Total subscriptions: ' + (_.keys(results.metrics)).length);
          return next();
        } else {
          util.error('Empty instance tags');
          return next(true);
        }
      }
    }
  );
}


function _aggregateResults(context, results, next) {
  util.log('Aggregating results');
  util.log(util.inspect(results.metrics, {depth: 5}));

  // for each subscription, aggregate the network in and network out over last
  // interval across all instances
  let subsNetwork = [];
  _.each(results.metrics,
    (subscriptionInstances, subscriptionId) => {
      const subscriptionStats = {};
      subscriptionStats.subscriptionId = subscriptionId;
      subscriptionStats.time = results.now;

      const totalNetworkIn = _.reduce(subscriptionInstances,
        (memo, instance) => {
          if (!_.isEmpty(instance.metrics.networkIn)) {
            return memo + instance.metrics.networkIn[0].value;
          } else {
            return memo;
          }
        }, 0);
      subscriptionStats.networkIn = totalNetworkIn;

      const totalNetworkOut = _.reduce(subscriptionInstances,
        (memo, instance) => {
          if (!_.isEmpty(instance.metrics.networkOut)) {
            return memo + instance.metrics.networkOut[0].value;
          } else {
            return memo;
          }
        }, 0);
      subscriptionStats.networkOut = totalNetworkOut;
      if (subscriptionStats.networkIn !== 0 && subscriptionStats.networkOut !== 0) {
        // only add if either of the two are not zero
        subsNetwork = [...subsNetwork, subscriptionStats];
      }
    }
  );
  // TODO: all the operations here are sync, use setImmediate
  // to make this async

  util.log('Aggregate results');

  results.subscriptionStats = subsNetwork;
  return setImmediate(next);
}

function _writeResults(context, results, next) {
  util.log('Writing results to file');
  util.log(util.inspect(results.subscriptionStats));
  const resultsOut = path.join(context.resultsDir, 'network.csv');
  const fields = ["subscriptionId", "time", "networkIn", "networkOut"];

  //const parser = new Json2csvParser({ fields });
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
  util.log('========== Getting results from aws ===========');
  if (context.execCount === 0) {
    util.log('Exec count reached, stopping timer');
    clearInterval(context.timer);
  }

  const results = {
    now: new Date(),
    metrics: {},
    instanceMap: [],
  };

  async.series([
    _fetchRunningInstances.bind(null, context, results),
    _getNetworkMetrics.bind(null, context, results),
    _createSubsInstancesMap.bind(null, context, results),
    _aggregateResults.bind(null, context, results),
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

module.exports = NetworkLoad;

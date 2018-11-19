const util = require('util');
const _ = require('underscore');
const async = require('async');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

// import Scheduler from './scheduler/scheduler.js';
const Scheduler = require('./scheduler/scheduler.js');
const NetworkLoad = require('./rules/networkLoad.js');
const DeleteBuckets = require('./rules/deleteBuckets.js');
const AWSConnection = require('./validators/connAWS.js');

const app = express();

// TODO: initialize runmode and logger as globals to be used across the
// application
const globalConfig = {};


function initConnection(config, next) {
  logger.info('Initializing connection');
  if (_.isEmpty(process.env.AWS_ACCESS_KEY)) {
    return next(Error('AWS Access key is required'));
  }

  if (_.isEmpty(process.env.AWS_SECRET_KEY)) {
    return next(Error('AWS Secret key is required'));
  }

  const connection = new AWSConnection(
    process.env.AWS_ACCESS_KEY,
    process.env.AWS_SECRET_KEY,
    process.env.AWS_REGION,
  );

  connection.initialize();

  config.connection = connection;
  return next();
}

function initScheduler(config, next) {
  logger.info('Initialiazing scheduler');
  config.scheduler = new Scheduler();

  return next();
}

function execRules(config, next) {
  const rules = {};
  const query = {};

  rules.network = new NetworkLoad(query, config.connection);
  rules.deleteBuckets = new DeleteBuckets(query, config.connection);
  rules.deleteBuckets.run();

  config.rules = rules;

  return next();
}

function bootServer() {
  // once all core components are running, expose API and UI to provide
  // info about the running processes
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // TODO add logger here
  // app.use(logger'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', routes);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use((err, req, res) => {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {},
    });
  });
}

const initOrder = [
  initConnection.bind(null, globalConfig),
  initScheduler.bind(null, globalConfig),
  execRules.bind(null, globalConfig),
  bootServer.bind(null, globalConfig),
];

// initialize the core components before bringing up API or UI
async.series(initOrder, (err) => {
  if (err) {
    logger.error('Error while initializing application');
    logger.error(util.inspect(err));
  }
});

module.exports = app;

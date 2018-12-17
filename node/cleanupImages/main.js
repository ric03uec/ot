'use strict';
const util = require('util');
//const winston = require('winston');
//const {combine, timestamp, label, printf} = winston.format;
//const logConfig = require('./config/logger.js');

//const logFormat = winston.format.printf(info => {
  //return util.format('%s [%s] %s: %s', info.timestamp, info.label, info.level, info.message);
//});

//const logger = winston.createLogger({
//  format: combine(
//    label({ label: 'cleanup-gcp-images' }),
//    timestamp(),
//    logFormat,
//  ),
//  transports: [
//    new winston.transports.Console(logConfig.console),
//  ],
//  exitOnError: false, // do not exit on handled exceptions
//});
//
//global.logger = logger;
//
global.logger = console;

//const App = require('./app');
//const app = new App();


    logger.info('Initializing connection-----------');

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
//}

//app.run((err) => {
// run((err) => {
//   if (err) {
//     logger.error('Error while running application');
//     logger.error(util.inspect(err));
//   } else {
//     logger.info('Run completed successfully');
//   }
// });

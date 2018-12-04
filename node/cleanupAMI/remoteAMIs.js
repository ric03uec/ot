const util = require('util');
const _ = require('underscore');
const async = require('async');

class RemoteAMIs {
  constructor(connection, awsAccountId) {
    this.connection = connection;
    this.awsAccountId = awsAccountId;
  }

  getAll(result) {
    logger.info('Fetching all AMIs');
    logger.info('\t account id: ' + this.awsAccountId);
    const params = {
      Owners: [
        this.awsAccountId,
      ],
      Filters: [
        {
          Name: 'state',
          Values: [
            'available'
          ]
        }
      ]
    };

    this.connection.ec2.describeImages(params,
      (err, data) => {
        if (err) {
          return result(err);
        }
        //logger.log(util.inspect(data));
        let imageIds = [];
        if (!_.isEmpty(data.Images)) {
          imageIds = _.map(data.Images,
            (image) => {
              return image.ImageId;
            }
          );
        }

        logger.info('Fetched all AMIs. Total count: ' + _.size(imageIds));
        return result(null, imageIds);
      }
    );
  }
}

module.exports = RemoteAMIs;

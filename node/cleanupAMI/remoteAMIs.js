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
        let amiList = [];
        if (!_.isEmpty(data.Images)) {
          _.each(data.Images,
            (image) => {
              const ami = {
                ImageId: image.ImageId,
                OwnerId: image.OwnerId,
                SnapshotId: image.BlockDeviceMappings[0].Ebs.SnapshotId,
              };

              amiList = amiList.concat(ami);
            }
          );
        }

        logger.info('Fetched all AMIs. Total count: ' + _.size(amiList));
        return result(null, amiList);
      }
    );
  }

  removeAMIs(amiList, result) {
    logger.info('Removing AMIs from AWS account');
    logger.info('\t account id: ' + this.awsAccountId);
    logger.info('\t AMIs to remove: ' + _.size(amiList));

    let flowData = {
      amiList: amiList,
    };

    //logger.info(util.inspect(flowData));
    return result();
    const deleteFlow = [
      deregisterAMIs.bind(this, flowData),
      deleteSnapshots.bind(this, flowData)
    ];

    async.series(deleteFlow, (err) => {
      return result(err);
    });
  }
}

function deregisterAMIs(flowData, next) {
  logger.info('Deregistering AMIs');

  function deregisterAmi(amiInfo, innerNext) {
    const params = {
      ImageId: amiInfo.ImageId,
    }

    this.connection.ec2.deregisterImage(params,
      (err, data) => {
        if (err) {
          logger.error('Error deregistering AMI: ' + amiInfo.ImageId);
        }
        return innerNext(err);
      }
    );
  }

  async.each(flowData.amiList, deregisterAMI,
    (err) => {
      return next(err);
    }
  );
}

function deleteSnapshots(flowData, next) {
  logger.info('Deleting snapshots');

  function deleteSnapshot(amiInfo, innerNext) {
    const params = {
      SnapshotId: amiInfo.SnapshotId,
    }

    this.connection.ec2.deleteSnapshot(params,
      (err, data) => {
        if (err) {
          logger.error('Error deleting snapshot: ' + amiInfo.SnapshotId);
        }
        return innerNext(err);
      }
    );
  }

  async.each(flowData.amiList, deleteSnapshot,
    (err) => {
      return next(err);
    }
  );
}

module.exports = RemoteAMIs;

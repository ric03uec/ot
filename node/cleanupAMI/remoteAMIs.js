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

  getSnapshots(result) {
    logger.info('Fetching all Snapshots');
    logger.info('\t account id: ' + this.awsAccountId);

    const params = {
      OwnerIds: [
        this.awsAccountId,
      ],
      Filters: [
        {
          Name: 'status',
          Values: [
            'completed'
          ]
        }
      ]
    };

    this.connection.ec2.describeSnapshots(params,
      (err, data) => {
        if (err) {
          return result(err);
        }
        let snapshotList = [];
        if (! _.isEmpty(data.Snapshots)) {
          _.each(data.Snapshots,
            (snapshot) => {
              snapshotList = snapshotList.concat(snapshot.SnapshotId);
            }
          );
        }

        logger.info('Fetched all Snapshots. Total count: ' +
          _.size(snapshotList));
        return result(null, snapshotList);
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
    //return result();

    //README: async.each should be applied to each AMI+Snapshot instead of
    // the full list of AMI's and then the full list of Snapshots
    const deleteFlow = [
      deregisterAMIs.bind(this, flowData),
      deleteSnapshots.bind(this, flowData)
    ];

    async.series(deleteFlow, (err) => {
      return result(err);
    });
  }

  removeSnapshots(snapshotList, result) {
    logger.info('Removing Snapshots from AWS account');
    logger.info('\t account id: ' + this.awsAccountId);

    function deleteSnapshot(snapshotId, innerNext) {
      const params = {
        SnapshotId: snapshotId,
      }

      this.connection.ec2.deleteSnapshot(params,
        (err, data) => {
          if (err) {
            logger.error('Error deleting snapshot: ' + snapshotId);
            logger.error(util.inspect(err));
          } else {
            logger.info('Successfully deleted snapshot: ' + snapshotId);
          }
          return innerNext(err);
        }
      );
    }

    // binding the context is required to access variables and methods of the
    // class
    async.eachSeries(snapshotList, deleteSnapshot.bind(this),
      (err) => {
        return result(err);
      }
    );
  }
}

function deregisterAMIs(flowData, next) {
  logger.info('Deregistering AMIs');

  function deregisterAMI(amiInfo, innerNext) {
    const params = {
      ImageId: amiInfo.ImageId,
    }

    this.connection.ec2.deregisterImage(params,
      (err, data) => {
        if (err) {
          logger.error('Error deregistering AMI: ' + amiInfo.ImageId);
          logger.error(util.inspect(err));
        } else {
          logger.info('Successfully deregistered AMI: ' + amiInfo.ImageId);
        }
        return innerNext(err);
      }
    );
  }

  // binding the context is required to access variables and methods of the
  // class
  async.each(flowData.amiList, deregisterAMI.bind(this),
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
          logger.error(util.inspect(err));
        } else {
          logger.info('Successfully deleted snapshot: ' + amiInfo.SnapshotId);
        }
        return innerNext(err);
      }
    );
  }

  // binding the context is required to access variables and methods of the
  // class
  async.each(flowData.amiList, deleteSnapshot.bind(this),
    (err) => {
      return next(err);
    }
  );
}

module.exports = RemoteAMIs;

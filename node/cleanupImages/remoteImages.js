const util = require('util');
const _ = require('underscore');
const async = require('async');

class RemoteImages {
  constructor(connection) {
    this.connection = connection;
  }

  getAll(result) {
    logger.info('Fetching all Images');
    const params = {};

    logger.info(util.inspect(this.connection))
    this.connection.getImages(params,
      (err, data) => {
        if (err) {
          return result(err);
        }
        logger.info(util.inspect(data));

        logger.info('Fetched all Images. Total count: ' + _.size(data));
        return result(null, data);
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

    //flowData.amiList = [flowData.amiList[0]];
    //logger.info(util.inspect(flowData));
    //return result();
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

  function deregisterAMI(amiInfo, innerNext) {
    const params = {
      ImageId: amiInfo.ImageId,
    }

    this.connection.ec2.deregisterImage(params,
      (err, data) => {
        if (err) {
          logger.error('Error deregistering AMI: ' + amiInfo.ImageId);
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

    that.connection.ec2.deleteSnapshot(params,
      (err, data) => {
        if (err) {
          logger.error('Error deleting snapshot: ' + amiInfo.SnapshotId);
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

module.exports = RemoteImages;

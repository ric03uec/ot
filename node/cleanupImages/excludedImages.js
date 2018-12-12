const _ = require('underscore');
const async = require('async');
const fs = require('fs');
const path = require('path');

class ExcludedImages{
  constructor() {
    this.dataFile = 'excludedAMIs.txt';
    this.dataFilePath = path.join(__dirname, 'data', this.dataFile);
  }

  loadImages(result) {
    logger.info('Loading all Images: ' + this.dataFilePath);
    fs.readFile(this.dataFilePath, 'utf8',
      (err, data) => {
        data = data.toString().split('\n');
        data = _.filter(data,
          (entry) => {
            return !_.isEmpty(entry.trim());
          }
        );
        return result(err, data);
      }
    );
  }
}

module.exports = ExcludedImages;

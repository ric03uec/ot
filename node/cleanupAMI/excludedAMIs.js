const _ = require('underscore');
const async = require('async');
const fs = require('fs-extra');
const path = require('path');

class ExcludedAMIs {
  constructor() {
    this.dataFile = 'excludedAMIs.txt';
    this.dataFilePath = path.join(__dirname, 'data', this.dataFile);
  }

  loadAMIs(result) {
    logger.info('Loading all AMIs: ' + this.dataFilePath);
    fs.readFile(this.dataFilePath, 'utf8',
      (err, data) => {
        return result(err, data.toString().split('\n'));
      }
    );
  }
}

module.exports = ExcludedAMIs;

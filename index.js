const bucketer            = require('./app/lib/bucketer');
const BucketConfiguration = require('./app/models/bucketConfiguration');

module.exports = {
  bucketer,
  BucketConfiguration,
  getBucketId: (string, bucketConfiguration) => {
    if (!(bucketConfiguration instanceof BucketConfiguration)) {
      bucketConfiguration = new BucketConfiguration(bucketConfiguration);
    }

    return bucketer.getBucketFromString(string, bucketConfiguration);
  }
};
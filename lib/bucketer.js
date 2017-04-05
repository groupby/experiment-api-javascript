// Use https://github.com/sangupta/murmurhttps://github.com/sangupta/murmur for java
// Do not require large modules or those with many dependencies - will blow up
const murmurhash     = require('murmurhash');
const MAX_HASH_VALUE = Math.pow(2, 32);
const MURMUR_SEED    = 2321168210;
const NO_BUCKET      = -1;

const generateBucketFractions = (bucketPercentages) => {
  return bucketPercentages.reduce((fractions, nextProportion) => {
    const prev = fractions.length ? fractions[fractions.length - 1] : 0;

    const fraction = (prev + nextProportion / 100);
    fractions.push(fraction);

    return fractions;
  }, []);
};

const placeInBucket = (hashValue, bucketThresholds) => {
  let bucketId = NO_BUCKET;
  for (let index = 0; index < bucketThresholds.length; index++) {
    if (hashValue > bucketThresholds[index]) {
      bucketId = index;
    } else {
      return bucketId;
    }
  }
  return NO_BUCKET;
};

const generateBucketThresholds = (offset, bucketFractions, trafficAllocation, maxValue) => {
  //add initial threshold to create the boundaries of the buckets
  const bucketBoundaries = [0, ...bucketFractions];
  return bucketBoundaries.map((value) => (value * trafficAllocation + offset) * maxValue / 100);
};

const validateBucketConfiguration = (bucketConfiguration) => {
  if (!bucketConfiguration || typeof bucketConfiguration !== 'object') {
    throw new Error('bucketConfiguration must be an object');
  }

  const {trafficAllocationOffset, trafficAllocation} = bucketConfiguration;

  if (!Array.isArray(bucketConfiguration.bucketPercentages) || bucketConfiguration.bucketPercentages.length < 2) {
    throw new Error('bucketConfiguration.bucketPercentages must be an array of at least 2');
  }

  bucketConfiguration.bucketPercentages.map((bucket) => {
    if (typeof bucket !== 'number') {
      throw new Error('bucketConfiguration.bucketPercentages must be an array of numbers');
    }
  });

  const sumBucketPercentages = bucketConfiguration.bucketPercentages.reduce((acc, value) => acc + value, 0);

  if (Math.abs(sumBucketPercentages - 100) > 0.001) {
    throw new Error(`bucketPercentages must sum to 100, instead sum to: ${sumBucketPercentages}`);
  }

  if (!trafficAllocation || typeof trafficAllocation !== 'number' || trafficAllocation <= 0 || trafficAllocation > 100) {
    throw new Error('bucketConfiguration.trafficAllocation must be a number greater than 0 and less than 100');
  }

  if (!trafficAllocationOffset && trafficAllocationOffset !== 0 || typeof trafficAllocationOffset !== 'number' || trafficAllocationOffset < 0 || trafficAllocationOffset > 100) {
    throw new Error('bucketConfiguration.trafficAllocation must be a number between 0 and 100');
  }

  if (trafficAllocationOffset + trafficAllocation > 100) {
    throw new Error('The sum of bucketConfiguration.trafficAllocation and bucketConfiguration.trafficAllocationOffset must be less than or equal to 100');
  }
};

const getBucketId = (hashString, bucketConfiguration) => {
  if (!hashString || typeof hashString !== 'string') {
    throw new Error('hashString must be a string');
  }

  const {trafficAllocationOffset, trafficAllocation} = bucketConfiguration;
  const bucketFractions = generateBucketFractions(bucketConfiguration.bucketPercentages);
  const bucketThresholds = generateBucketThresholds(trafficAllocationOffset, bucketFractions, trafficAllocation, MAX_HASH_VALUE);
  const hashValue = murmurhash.v3(hashString, MURMUR_SEED);

  return placeInBucket(hashValue, bucketThresholds);
};

const Bucketer = function (bucketConfiguration) {
  const self = this;

  validateBucketConfiguration(bucketConfiguration);

  self.getBucketId = (targetString) => getBucketId(targetString, bucketConfiguration);

  return self;
};

Bucketer.validateBucketConfiguration = validateBucketConfiguration;
Bucketer.placeInBucket               = placeInBucket;
Bucketer.generateBucketFractions     = generateBucketFractions;
Bucketer.generateBucketThresholds    = generateBucketThresholds;
module.exports                       = Bucketer;
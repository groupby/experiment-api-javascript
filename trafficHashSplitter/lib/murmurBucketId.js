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
  const thresholdFractions = bucketFractions.map((value) => (value * trafficAllocation + offset) * maxValue / 100);
  thresholdFractions.unshift(offset / 100);
  return thresholdFractions;
};

const getBucketId = (string, bucketingSpec) => {
  

  const {trafficAllocationOffset, trafficAllocation} = bucketingSpec;

  if (typeof bucketingSpec !== 'object') {
    throw new Error('bucketingSpec must be an object');
  }

  if (!Array.isArray(bucketingSpec.bucketPercentages) || bucketingSpec.bucketPercentages.length < 2) {
    throw new Error('bucketingSpec.bucketPercentages must be an array of at least 2');
  }

  bucketingSpec.bucketPercentages.map((bucket) => {
    if (typeof bucket !== 'number') {
      throw new Error('bucketingSpec.bucketPercentages must be an array of numbers');
    }
  });

  if (typeof trafficAllocation !== 'number') {
    throw new Error('bucketingSpec.trafficAllocation must be a number');
  }

  if (trafficAllocationOffset + trafficAllocation > 100) {
    throw new Error('The sum of bucketingSpec.trafficAllocation and bucketingSpec.trafficAllocationOffset must be less than or equal to 100.');
  }

  const bucketFractions = generateBucketFractions(bucketingSpec.bucketPercentages);

  const bucketThresholds = generateBucketThresholds(trafficAllocationOffset, bucketFractions, trafficAllocation, MAX_HASH_VALUE);

  const hashValue = murmurhash.v3(string, MURMUR_SEED);

  return placeInBucket(hashValue, bucketThresholds);
};

module.exports                          = getBucketId;
module.exports.generateBucketFractions  = generateBucketFractions;
module.exports.generateBucketThresholds = generateBucketThresholds;
module.exports.placeInBucket            = placeInBucket;
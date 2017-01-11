const chai                = require('chai');
const expect              = chai.expect;
const _                   = require('lodash');
const BucketConfiguration = require('../../models/bucketConfiguration');

describe('Bucket configuration model tests', () => {
  it('creates an experiment with the correct parameters', () => {
    const params = {
      trafficAllocation:       50,
      trafficAllocationOffset: 0,
      bucketPercentages:       [
        10,
        90
      ]
    };

    const expectedBucket = {
      trafficAllocation:       50,
      trafficAllocationOffset: 0,
      bucketPercentages:       [
        10,
        90
      ]
    };

    const bucket = new BucketConfiguration(params);
    expect(bucket).to.eql(expectedBucket);
  });

  it('throws when bucketPercentages add up to more than 100', () => {
    const params = {
      trafficAllocation:       50,
      trafficAllocationOffset: 0,
      bucketPercentages:       [
        11,
        90
      ]
    };
    expect(() => new BucketConfiguration(params)).to.throw(`sum of bucket percentages must equal 100. sum of ${params.bucketPercentages} equals ${_.sum(params.bucketPercentages)}`);
  });

  it('throws when trafficAllocationOffset + trafficAllocation is more than 100', () => {
    const params = {
      trafficAllocation:       50,
      trafficAllocationOffset: 60,
      bucketPercentages:       [
        10,
        90
      ]
    };
    expect(() => new BucketConfiguration(params)).to.throw('sum of trafficAllocation and trafficAllocationOffset must be less than 100. Sum is 110');
  });

  it('throws when validation fails', () => {
    const params = {
      trafficAllocation:       'notAnInteger',
      trafficAllocationOffset: 0,
      bucketPercentages:       [
        10,
        90
      ]
    };
    expect(() => new BucketConfiguration(params)).to.throw('@.trafficAllocation: must be integer, but is string');
  });

});

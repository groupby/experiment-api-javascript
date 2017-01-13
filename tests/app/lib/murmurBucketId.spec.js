const chai   = require('chai');
const expect = chai.expect;

const Promise = require('bluebird');
const csv     = require('csv');
const path    = require('path');
const fs      = require('fs');
const _       = require('lodash');

const csvParsePromise   = Promise.promisify(csv.parse);
const fsReadFilePromise = Promise.promisify(fs.readFile);

const testStringFilePath                = '../../resources/testStrings.csv';
const expectedBucketsFilePath2          = '../../resources/expectedBuckets.csv';
const expectedBucketsWithOffsetFilePath = '../../resources/expectedBuckets15Offset.csv';
const BucketConfiguration = require('../../../app/models/bucketConfiguration');

const bucket = require('../../../app/lib/murmurBucketId');

describe('Bucketing function', () => {
  it('returns the appropriate fractions from bucket percentages', () => {
    const bucketPercentages = [
      25,
      30,
      30,
      15
    ];

    const expectedFractions = [0.25, 0.55, 0.85, 1];

    const generatedBucketFractions = bucket.generateBucketFractions(bucketPercentages);
    expect(generatedBucketFractions.length).to.eql(expectedFractions.length);
    generatedBucketFractions.map((value, index) => {
      expect(value).to.be.closeTo(expectedFractions[index], 0.0001);
    });
  });

  it('returns the appropriate threshold values from bucket fractions, 0 offset and max value 1', () => {
    const bucketFractions   = [0.3, 0.6, 0.8, 1];
    const offset            = 20;
    const trafficAllocation = 50;
    const maxValue          = 1;
    const expectedThreshold = [0.2, 0.35, 0.5, 0.6, 0.7];

    const generatedBucketThresholds = bucket.generateBucketThresholds(offset, bucketFractions, trafficAllocation, maxValue);

    expect(generatedBucketThresholds.length).to.equal(expectedThreshold.length);
    generatedBucketThresholds.map((value, index) => {
      expect(value).to.be.closeTo(expectedThreshold[index], 0.0001);
    });
  });

  it('throws if bucketingSpec is null', () => {
    expect(() => bucket.getBucketFromString('testString', null)).to.throw('bucketConfiguration must be an object');
  });

  it('throws if bucketingSpec is undefined', () => {
    expect(() => bucket.getBucketFromString('testString')).to.throw('bucketConfiguration must be an object');
  });

  it('throws if bucketingSpec is not object', () => {
    expect(() => bucket.getBucketFromString('testString', 'notAnObject')).to.throw('bucketConfiguration must be an object');
  });

  it('throws if hashString is null', () => {
    expect(() => bucket.getBucketFromString(null, {})).to.throw('hashString must be a string');
  });

  it('throws if hashString is undefined', () => {
    expect(() => bucket.getBucketFromString(undefined, {})).to.throw('hashString must be a string');
  });

  it('throws if hashString is not object', () => {
    expect(() => bucket.getBucketFromString(9, {})).to.throw('hashString must be a string');
  });

  it('throws if bucketPercentages is not an array', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: null,
      trafficAllocation: 100,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.bucketPercentages must be an array of at least 2');
  });

  it('throws if bucketPercentages is array of less than length 2', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1],
      trafficAllocation: 100,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.bucketPercentages must be an array of at least 2');
  });

  it('throws if bucketPercentages contains non-numbers', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 'notANum'],
      trafficAllocation: 100,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.bucketPercentages must be an array of numbers');
  });

  it('throws if trafficAllocation is null', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 99],
      trafficAllocation: null,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.trafficAllocation must be a number greater than 0 and less than 100');
  });

  it('throws if trafficAllocation is over 100', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 99],
      trafficAllocation: 110,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.trafficAllocation must be a number greater than 0 and less than 100');
  });

  it('throws if trafficAllocation is 0', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 99],
      trafficAllocation: 0,
      trafficAllocationOffset: 0
    })).to.throw('bucketConfiguration.trafficAllocation must be a number greater than 0 and less than 100');
  });

  it('throws if trafficAllocationOffset is negative', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 99],
      trafficAllocation: 1,
      trafficAllocationOffset: -1
    })).to.throw('bucketConfiguration.trafficAllocation must be a number between 0 and 100');
  });

  it('throws if trafficAllocationOffset and trafficAllocation add to greater than 100', () => {
    expect(() => bucket.getBucketFromString('hashString', {
      bucketPercentages: [1, 99],
      trafficAllocation: 60,
      trafficAllocationOffset: 50
    })).to.throw('The sum of bucketConfiguration.trafficAllocation and bucketConfiguration.trafficAllocationOffset must be less than or equal to 100');
  });

  it('returns -1 if hash lower than smallest threshold', () => {
    const bucketThresholds = [0.2, 0.35, 0.5, 0.6, 0.7];
    const hashValue        = 0.1;

    expect(bucket.placeInBucket(hashValue, bucketThresholds)).to.eql(-1);
  });

  it('returns 0 if hash between first and second threshold', () => {
    const bucketThresholds = [0.2, 0.35, 0.5, 0.6, 0.7];
    const hashValue        = 0.31;

    expect(bucket.placeInBucket(hashValue, bucketThresholds)).to.eql(0);
  });

  it('returns 3 if hash between fourth and fifth threshold', () => {
    const bucketThresholds = [0.2, 0.35, 0.5, 0.6, 0.7];
    const hashValue        = 0.65;

    expect(bucket.placeInBucket(hashValue, bucketThresholds)).to.eql(3);
  });

  it('returns -1 if hash higher than greatest threshold', () => {
    const bucketThresholds = [0.2, 0.35, 0.5, 0.6, 0.7];
    const hashValue        = 0.8;

    expect(bucket.placeInBucket(hashValue, bucketThresholds)).to.eql(-1);
  });

  it('buckets into expected buckets with 0 offset', (done) => {
    const bucketSpec = new BucketConfiguration({
      trafficAllocation:       75,
      trafficAllocationOffset: 0,
      bucketPercentages:       [
        25,
        30,
        30,
        15
      ]
    });

    fsReadFilePromise(path.join(__dirname, testStringFilePath), 'utf-8')
    .then(csvParsePromise)
    .then(_.flatten)
    .then((strings) => strings.map((string) => bucket.getBucketFromString(string, bucketSpec)).map((value) => value === null ? -1 : value))
    .then((results) => {
      return fsReadFilePromise(path.join(__dirname, expectedBucketsFilePath2), 'utf-8')
      .then((fileContents) => csvParsePromise(fileContents, {auto_parse: true}))
      .then(_.flatten)
      .then((table) => {
        expect(results).to.eql(table);
        done();
      });
    })
    .catch((err) => done(err || 'fail'));
  });

  it('buckets into expected buckets with 15 offset', (done) => {
    const bucketSpec = new BucketConfiguration({
      trafficAllocation:       75,
      trafficAllocationOffset: 15,
      bucketPercentages:       [
        25,
        30,
        30,
        15
      ]
    });

    fsReadFilePromise(path.join(__dirname, testStringFilePath), 'utf-8')
    .then(csvParsePromise)
    .then(_.flatten)
    .then((strings) => strings.map((string) => bucket.getBucketFromString(string, bucketSpec)).map((value) => value === null ? -1 : value))
    .then((results) => fsReadFilePromise(path.join(__dirname, expectedBucketsWithOffsetFilePath), 'utf-8')
    .then((fileContents) => csvParsePromise(fileContents, {auto_parse: true}))
    .then(_.flatten)
    .then((table) => {
      expect(results).to.eql(table);
      done();
    }))
    .catch((err) => done(err || 'fail'));
  });

});

const chai   = require('chai');
const expect = chai.expect;

const Promise = require('bluebird');
const csv     = require('csv');
const path    = require('path');
const fs      = require('fs');
const _       = require('lodash');

const csvParsePromise   = Promise.promisify(csv.parse);
const fsReadFilePromise = Promise.promisify(fs.readFile);

const testStringFilePath                = '../resources/testStrings.csv';
const expectedBucketsFilePath2          = '../resources/expectedBuckets.csv';
const expectedBucketsWithOffsetFilePath = '../resources/expectedBuckets15Offset.csv';
const BucketConfiguration = require('../../trafficHashSplitter/models/bucketConfiguration');

const bucket = require('../../trafficHashSplitter/lib/murmurBucketId');

describe('bucketing function', () => {

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
    .then((strings) => strings.map((string) => bucket(string, bucketSpec)).map((value) => value === null ? -1 : value))
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
    .then((strings) => strings.map((string) => bucket(string, bucketSpec)).map((value) => value === null ? -1 : value))
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

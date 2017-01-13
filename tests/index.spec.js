const chai   = require('chai');
const expect = chai.expect;

const Promise = require('bluebird');
const csv     = require('csv');
const path    = require('path');
const fs      = require('fs');
const _       = require('lodash');

const csvParsePromise   = Promise.promisify(csv.parse);
const fsReadFilePromise = Promise.promisify(fs.readFile);

const testStringFilePath                = './resources/testStrings.csv';
const expectedBucketsFilePath2          = './resources/expectedBuckets.csv';
const expectedBucketsWithOffsetFilePath = './resources/expectedBuckets15Offset.csv';
const BucketConfiguration = require('../app/models/bucketConfiguration');



const TrafficHashSplitter = require('../index').TrafficHashSplitter;

describe('Exports', () => {

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
    .then((strings) => strings.map((string) => TrafficHashSplitter.getBucketFromString(string, bucketSpec)).map((value) => value === null ? -1 : value))
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
    .then((strings) => strings.map((string) => TrafficHashSplitter.getBucketFromString(string, bucketSpec)).map((value) => value === null ? -1 : value))
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
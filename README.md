# experiment-api-javascript

[![Greenkeeper badge](https://badges.greenkeeper.io/groupby/experiment-api-javascript.svg)](https://greenkeeper.io/)

## Install

```bash
npm install experiment-api
```

## Use
```javascript
const experimentApi = require('experiment-api');
const Bucketer = experimentApi.bucketer.Bucketer;

const bucketConfiguration = {
  trafficAllocation:       75,
  trafficAllocationOffset: 0,
  bucketPercentages:       [
    25,
    30,
    30,
    15
  ]
};

const bucketer = new Bucketer(bucketConfiguration);
const bucketId = bucketer.getBucketId('some string like visitorId');

switch (bucketId) {
  case -1:
    console.log('No bucket');
    break;
  case 0:
    console.log('First bucket. 25% bucket');
    break;
  case 1:
    console.log('Second bucket. 30% bucket');
    break;
  case 2:
    console.log('Third bucket. 30% bucket');
    break;
  case 3:
    console.log('Forth bucket. 15% bucket');
    break;
  default:
    console.log('Should not happen');
    break
}
```
const utils       = require('../../utils');
const inspector   = require('schema-inspector');
const _           = require('lodash');
const almostEqual = require('almost-equal');

const SCHEMAS = {
  sanitization: {
    type:       'object',
    properties: {
      bucketPercentage:        {
        type:  'array',
        items: {
          type: 'integer'
        }
      },
      trafficAllocation:       {
        type: 'integer'
      },
      trafficAllocationOffset: {
        type: 'integer'
      }
    }
  },
  validation:   {
    type:       'object',
    strict:     false,
    properties: {
      bucketPercentages:       {
        type:      'array',
        minLength: 2,
        items:     {
          type: 'integer'
        }
      },
      trafficAllocation:       {
        type: 'integer',
        gt:   0,
        lte:  100
      },
      trafficAllocationOffset: {
        type: 'integer',
        gte:  0,
        lte:  100
      }
    }
  }
};

const BucketConfiguration = function (params) {
  const self = this;
  params     = utils.pruneNullAndUndefined(params);

  inspector.sanitize(SCHEMAS.sanitization, params);
  const result = inspector.validate(SCHEMAS.validation, params);

  if (!result.valid) {
    throw new Error(result.format());
  }

  if (!almostEqual(_.sum(params.bucketPercentages), 100, 0.001)) {
    throw new Error(`sum of bucket percentages must equal 100. sum of ${params.bucketPercentages} equals ${_.sum(params.bucketPercentages)}`);
  }

  const trafficSum = params.trafficAllocationOffset + params.trafficAllocation;
  if (trafficSum > 100) {
    throw new Error(`sum of trafficAllocation and trafficAllocationOffset must be less than 100. Sum is ${trafficSum}`);
  }
  _.merge(self, params);

  return self;
};

module.exports = BucketConfiguration;

module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
  /******/ 	const installedModules = {};

/******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
    /******/ 		if (installedModules[moduleId])
      /******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
    /******/ 		const module = installedModules[moduleId] = {
      /******/ 			exports: {},
      /******/ 			id: moduleId,
      /******/ 			loaded: false
    /******/ 		};

/******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
    /******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
    /******/ 		return module.exports;
  /******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
  /******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
  /******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
  /******/ 	__webpack_require__.p = '';

/******/ 	// Load entry module and return exports
  /******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
  /***/ function(module, exports, __webpack_require__) {

    module.exports = __webpack_require__(1);


  /***/ },
/* 1 */
  /***/ function(module, exports, __webpack_require__) {

    'use strict';

    const Bucketer = __webpack_require__(2);

    module.exports = {
	  bucketer: {
	    Bucketer: Bucketer
	  }
    };

  /***/ },
/* 2 */
  /***/ function(module, exports, __webpack_require__) {

    'use strict';

    const _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) {
      return typeof obj; 
    } : function (obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj; 
    };

	// Use https://github.com/sangupta/murmurhttps://github.com/sangupta/murmur for java
	// Do not require large modules or those with many dependencies - will blow up
    const murmurhash = __webpack_require__(3);
    const MAX_HASH_VALUE = Math.pow(2, 32);
    const MURMUR_SEED = 2321168210;
    const NO_BUCKET = -1;

    const generateBucketFractions = function generateBucketFractions(bucketPercentages) {
	  return bucketPercentages.reduce((fractions, nextProportion) => {
	    const prev = fractions.length ? fractions[fractions.length - 1] : 0;

	    const fraction = prev + nextProportion / 100;
	    fractions.push(fraction);

	    return fractions;
	  }, []);
    };

    const placeInBucket = function placeInBucket(hashValue, bucketThresholds) {
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

    const generateBucketThresholds = function generateBucketThresholds(offset, bucketFractions, trafficAllocation, maxValue) {
	  const thresholdFractions = bucketFractions.map((value) => {
	    return (value * trafficAllocation + offset) * maxValue / 100;
	  });
	  thresholdFractions.unshift(offset / 100);
	  return thresholdFractions;
    };

    const validateBucketConfiguration = function validateBucketConfiguration(bucketConfiguration) {
	  if (!bucketConfiguration || (typeof bucketConfiguration === 'undefined' ? 'undefined' : _typeof(bucketConfiguration)) !== 'object') {
	    throw new Error('bucketConfiguration must be an object');
	  }

	  let trafficAllocationOffset = bucketConfiguration.trafficAllocationOffset,
	      trafficAllocation = bucketConfiguration.trafficAllocation;


	  if (!Array.isArray(bucketConfiguration.bucketPercentages) || bucketConfiguration.bucketPercentages.length < 2) {
	    throw new Error('bucketConfiguration.bucketPercentages must be an array of at least 2');
	  }

	  bucketConfiguration.bucketPercentages.map((bucket) => {
	    if (typeof bucket !== 'number') {
	      throw new Error('bucketConfiguration.bucketPercentages must be an array of numbers');
	    }
	  });

	  const sumBucketPercentages = bucketConfiguration.bucketPercentages.reduce((acc, value) => {
	    return acc + value;
	  }, 0);

	  if (Math.abs(sumBucketPercentages - 100) > 0.001) {
	    throw new Error(`bucketPercentages must sum to 100, instead sum to: ${ sumBucketPercentages}`);
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

    const getBucketId = function getBucketId(hashString, bucketConfiguration) {
	  if (!hashString || typeof hashString !== 'string') {
	    throw new Error('hashString must be a string');
	  }

	  let trafficAllocationOffset = bucketConfiguration.trafficAllocationOffset,
	      trafficAllocation = bucketConfiguration.trafficAllocation;

	  const bucketFractions = generateBucketFractions(bucketConfiguration.bucketPercentages);
	  const bucketThresholds = generateBucketThresholds(trafficAllocationOffset, bucketFractions, trafficAllocation, MAX_HASH_VALUE);
	  const hashValue = murmurhash.v3(hashString, MURMUR_SEED);

	  return placeInBucket(hashValue, bucketThresholds);
    };

    const Bucketer = function Bucketer(bucketConfiguration) {
	  const self = this;

	  validateBucketConfiguration(bucketConfiguration);

	  self.getBucketId = function (targetString) {
	    return getBucketId(targetString, bucketConfiguration);
	  };

	  return self;
    };

    Bucketer.validateBucketConfiguration = validateBucketConfiguration;
    Bucketer.placeInBucket = placeInBucket;
    Bucketer.generateBucketFractions = generateBucketFractions;
    Bucketer.generateBucketThresholds = generateBucketThresholds;
    module.exports = Bucketer;

  /***/ },
/* 3 */
  /***/ function(module, exports) {

    module.exports = require('murmurhash');

  /***/ }
/******/ ]);
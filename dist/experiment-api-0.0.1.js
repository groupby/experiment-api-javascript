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
  /***/ function(module, exports, __webpack_require__) {

    (function(){
	  const _global = this;

	  /**
	   * JS Implementation of MurmurHash2
	   *
	   * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	   * @see http://github.com/garycourt/murmurhash-js
	   * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
	   * @see http://sites.google.com/site/murmurhash/
	   *
	   * @param {string} str ASCII only
	   * @param {number} seed Positive integer only
	   * @return {number} 32-bit positive integer hash
	   */
	  function MurmurHashV2(str, seed) {
	    let
	      l = str.length,
	      h = seed ^ l,
	      i = 0,
	      k;

	    while (l >= 4) {
	      k =
	        ((str.charCodeAt(i) & 0xff)) |
	        ((str.charCodeAt(++i) & 0xff) << 8) |
	        ((str.charCodeAt(++i) & 0xff) << 16) |
	        ((str.charCodeAt(++i) & 0xff) << 24);

	      k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
	      k ^= k >>> 24;
	      k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));

	    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

	      l -= 4;
	      ++i;
	    }

	    switch (l) {
	    case 3: h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
	    case 2: h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
	    case 1: h ^= (str.charCodeAt(i) & 0xff);
	            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
	    }

	    h ^= h >>> 13;
	    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
	    h ^= h >>> 15;

	    return h >>> 0;
	  }

	  /**
	   * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
	   *
	   * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	   * @see http://github.com/garycourt/murmurhash-js
	   * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
	   * @see http://sites.google.com/site/murmurhash/
	   *
	   * @param {string} key ASCII only
	   * @param {number} seed Positive integer only
	   * @return {number} 32-bit positive integer hash
	   */
	  function MurmurHashV3(key, seed) {
	    let remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

	    remainder = key.length & 3; // key.length % 4
	    bytes = key.length - remainder;
	    h1 = seed;
	    c1 = 0xcc9e2d51;
	    c2 = 0x1b873593;
	    i = 0;

	    while (i < bytes) {
	        k1 =
	          ((key.charCodeAt(i) & 0xff)) |
	          ((key.charCodeAt(++i) & 0xff) << 8) |
	          ((key.charCodeAt(++i) & 0xff) << 16) |
	          ((key.charCodeAt(++i) & 0xff) << 24);
	      ++i;

	      k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
	      k1 = (k1 << 15) | (k1 >>> 17);
	      k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

	      h1 ^= k1;
	          h1 = (h1 << 13) | (h1 >>> 19);
	      h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
	      h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	    }

	    k1 = 0;

	    switch (remainder) {
	      case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
	      case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
	      case 1: k1 ^= (key.charCodeAt(i) & 0xff);

	      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
	      k1 = (k1 << 15) | (k1 >>> 17);
	      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
	      h1 ^= k1;
	    }

	    h1 ^= key.length;

	    h1 ^= h1 >>> 16;
	    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	    h1 ^= h1 >>> 13;
	    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	    h1 ^= h1 >>> 16;

	    return h1 >>> 0;
	  }

	  const murmur = MurmurHashV3;
	  murmur.v2 = MurmurHashV2;
	  murmur.v3 = MurmurHashV3;

	  if (true) {
	    module.exports = murmur;
	  } else {
	    const _previousRoot = _global.murmur;
	    murmur.noConflict = function() {
	      _global.murmur = _previousRoot;
	      return murmur;
	    };
	    _global.murmur = murmur;
	  }
    }());


  /***/ }
/******/ ]);
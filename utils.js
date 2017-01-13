const _ = require('lodash');

const deepOmitBy = (collection, predicate) => {
  let newCollection = null;

  if (_.isArray(collection)) {
    newCollection = [];
  } else if (_.isFunction(collection)) {
    newCollection = collection;
  } else if (_.isObject(collection)) {
    newCollection = _.omitBy(collection, predicate);
  } else {
    return collection;
  }

  _.forEach(collection, (value, key) => {
    if (_.isArray(collection)) {
      key = parseInt(key);
    }

    if (predicate(value, key)) {
      return;
    } else {
      newCollection[key] = deepOmitBy(collection[key], predicate);
    }
  });

  return newCollection;
};

const pruneNullAndUndefined = (obj) => {
  return deepOmitBy(obj, (value) => {
    return _.isNil(value);
  });
};

module.exports.pruneNullAndUndefined = pruneNullAndUndefined;

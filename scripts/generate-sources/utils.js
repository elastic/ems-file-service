/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

function titleCase(str) {
  return str.replace(/\w\S*/g, (str) => `${str.charAt(0).toUpperCase()}${str.substr(1).toLowerCase()}`);
}

function stripWdUri(uri) {
  const value = typeof uri === 'string' ? uri : uri.value;
  return value.replace('http://www.wikidata.org/entity/', '');
}

module.exports.titleCase = titleCase;
module.exports.stripWdUri = stripWdUri;

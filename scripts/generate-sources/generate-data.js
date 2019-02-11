/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const { URL } = require('url');
const fetch = require('make-fetch-happen').defaults({
  cacheManager: './.cache',
  retry: {
    retries: 5,
    randomize: true,
  },
});
const cleanGeom = require('../clean-geom');

module.exports = async function getSophoxVectors(opts) {
  opts = {
    format: 'geojson',
    sparql: '',
    ...opts,
  };
  const url = new URL(`https://sophox.org/regions/${opts.format}.json`);
  const sparql = encodeURIComponent(opts.sparql);
  url.search = `sparql=${sparql}`;
  const res = await fetch(url.toString());
  const geojson = await res.json();
  const clean = cleanGeom(geojson);
  const orderedFeatures = clean.features.sort((a, b) => a.id > b.id);
  return {
    type: 'FeatureCollection',
    features: orderedFeatures,
  };
};

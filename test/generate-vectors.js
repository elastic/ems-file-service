/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tape = require('tape');
const generateVectors = require('../scripts/generate-vectors');

const sources = require('./fixtures/sources.json');

const v1Expected = [{
  'src': 'data/mordor_v1.geo.json',
  'dest': 'dist/files/mordor_v1.geo.json',
}, {
  'src': 'data/mordor_v1.geo.json',
  'dest': 'dist/blob/111111111111',
}, {
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/files/gondor_v2.geo.json',
}, {
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/blob/222222222222',
}];

const v2Expected = [{
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/files/gondor_v2.geo.json',
}, {
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/blob/222222222222',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/files/shire_v2.geo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/blob/333333333333',
}];

const prodExpected = [{
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/files/gondor_v2.geo.json',
}, {
  'src': 'data/gondor_v2.geo.json',
  'dest': 'dist/blob/222222222222',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}];

const v3Expected = [{
  'src': 'data/gondor_v3.geo.json',
  'dest': 'dist/files/gondor_v3.geo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/files/shire_v2.geo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/blob/333333333333',
}];

tape('Generate vector layers for versions', t => {
  const v1 = generateVectors(sources, {
    version: 'v1',
  });
  t.deepEquals(v1, v1Expected, 'Version v1 (default: staging)');

  const v2 = generateVectors(sources, {
    version: 'v2',
  });
  t.deepEquals(v2, v2Expected, 'Version v2 (default: staging)');

  const prod = generateVectors(sources, {
    version: 'v2',
    production: true,
  });
  t.deepEquals(prod, prodExpected, 'Version v2 (production');
  t.end();
});

tape('Generate vector layers for future versions that do not have `ids`', t => {
  const v3 = generateVectors(sources, {
    version: 'v3',
  });
  t.deepEquals(v3, v3Expected, 'Version v3');
  t.end();
});

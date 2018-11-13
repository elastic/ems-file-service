/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tape = require('tap').test;
const { generateVectorManifest, generateCatalogueManifest } = require('../scripts/generate-manifest');
const manifestv1 = require('./manifest-v1');
const manifestv2 = require('./manifest-v2');
const manifestv6 = require('./manifest-v6');
const vectors = require('./vectors-all');

const sources = require('./fixtures/sources.json');

tape('Generate manifests', t => {

  t.test('v1 tests', t => manifestv1(t));
  t.test('v2 tests', t => manifestv2(t));
  t.test('v6 tests', t => manifestv6(t));

  const noVersion = generateVectorManifest(sources);
  t.deepEquals(noVersion, { layers: [] }, 'no layers when version 0');

  t.throws(function () {
    generateVectorManifest(sources, {
      version: 'v9999',
    });
  }, 'generateVectorManifest throws on unused version');

  t.throws(function () {
    generateVectorManifest(sources, {
      version: 'notarealversion',
    });
  }, 'generateVectorManifest throws on invalid version number');

  t.throws(function () {
    generateCatalogueManifest({
      version: 'notarealversion',
    });
  }, 'generateCatalogueManifest throws on invalid version number');

  t.end();
});

tape('Generate vectors', t => {
  t.test('all versions', t => vectors(t));
  t.end();
});

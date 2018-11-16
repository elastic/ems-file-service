/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tap = require('tap').test;
const { generateVectorManifest, generateCatalogueManifest } = require('../scripts/generate-manifest');

const sources = require('./fixtures/sources.json');

tap('Bad manifests', t => {

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

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";

import { test as tap } from "tap";

import {
  generateCatalogueManifest,
  generateVectorManifest,
} from "../scripts/generate-manifest.js";

const sources = JSON.parse(
  fs.readFileSync("./test/fixtures/valid-sources/sources.json", "utf8")
);

tap('Bad manifests', t => {

  const noVersion = generateVectorManifest(sources);
  t.same(noVersion, { version: '0.0', layers: [] }, 'no layers when version 0');

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

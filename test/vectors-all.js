/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";
import { test as tap } from "tap";

import { generateVectors } from "../scripts/generate-vectors.js";

const sources = JSON.parse(
  fs.readFileSync("./test/fixtures/valid-sources/sources.json", "utf8")
);

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
  'src': 'data/rohan_v2.geo.json',
  'dest': 'dist/files/rohan_v2.geo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/blob/444444444444',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/files/shire_v2.geo.json',
}, {
  'src': 'data/shire_v2.topo.json',
  'dest': 'dist/files/shire_v2.topo.json',
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
  'src': 'data/rohan_v2.geo.json',
  'dest': 'dist/files/rohan_v2.geo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/blob/444444444444',
}];

const v3Expected = [{
  'src': 'data/gondor_v3.geo.json',
  'dest': 'dist/files/gondor_v3.geo.json',
}, {
  'src': 'data/rohan_v2.geo.json',
  'dest': 'dist/files/rohan_v2.geo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/blob/444444444444',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/files/shire_v2.geo.json',
}, {
  'src': 'data/shire_v2.topo.json',
  'dest': 'dist/files/shire_v2.topo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/blob/333333333333',
}];

const v6Expected = [{
  'src': 'data/gondor_v3.geo.json',
  'dest': 'dist/files/gondor_v3.geo.json',
}, {
  'src': 'data/rohan_v2.geo.json',
  'dest': 'dist/files/rohan_v2.geo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/files/rohan_v2.topo.json',
}, {
  'src': 'data/rohan_v2.topo.json',
  'dest': 'dist/blob/444444444444',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/files/shire_v2.geo.json',
}, {
  'src': 'data/shire_v2.topo.json',
  'dest': 'dist/files/shire_v2.topo.json',
}, {
  'src': 'data/shire_v2.geo.json',
  'dest': 'dist/blob/333333333333',
}];

tap('vector tests', t => {
  const v1 = generateVectors(sources, {
    version: 'v1',
  });
  t.same(v1, v1Expected, 'Version v1 (default: staging)');

  const v2 = generateVectors(sources, {
    version: 'v2',
  });
  t.same(v2, v2Expected, 'Version v2 (default: staging)');

  const prod = generateVectors(sources, {
    version: 'v2',
    production: true,
  });
  t.same(prod, prodExpected, 'Version v2 (production');

  const v3 = generateVectors(sources, {
    version: 'v3',
  });
  t.same(v3, v3Expected, 'Version v3');

  const v6 = generateVectors(sources, {
    version: 'v6.6',
  });
  t.same(v6, v6Expected, 'Version 6.6');
  t.end();
});

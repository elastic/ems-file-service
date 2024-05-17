/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from 'node:fs';
import path from 'node:path';

import { mkdirp } from 'mkdirp';
import hjson from 'hjson';
import { glob } from 'glob';
import rewind from 'geojson-rewind';

import { generateVectorManifest, generateCatalogueManifest } from './scripts/generate-manifest.js';
import {generateVectors} from './scripts/generate-vectors.js';
import constants from './scripts/constants.js';

const tileManifestHostname = process.env.TILE_HOST || constants.TILE_STAGING_HOST;
const vectorManifestHostname = process.env.VECTOR_HOST || constants.VECTOR_STAGING_HOST;
const production = vectorManifestHostname === constants.VECTOR_PRODUCTION_HOST;

const sources = glob.sync("sources/**/*.*json").map((source) => {
  const f = fs.readFileSync(source, "utf8");
  return hjson.parse(f);
});

const fieldInfo = hjson.parse(fs.readFileSync("./schema/fields.hjson", "utf8"));

// Clean and recreate `./dist` directories
fs.rmSync("dist", { recursive: true, force: true });
mkdirp.sync('./dist/vector/blob');
mkdirp.sync('./dist/vector/files');
mkdirp.sync('./dist/catalogue');

const vectorFiles = new Map();

const versions = [
  ...constants.VERSIONS,
  ...constants.DATE_VERSIONS.map( el =>  el.date),
  ...[ constants.LATEST_TAG ],
]

for (const version of versions) {
  const catalogueManifest = generateCatalogueManifest({
    version: version,
    tileHostname: tileManifestHostname,
    vectorHostname: vectorManifestHostname,
  });
  const vectorManifest = generateVectorManifest(sources, {
    version: version,
    production: production,
    hostname: vectorManifestHostname,
    fieldInfo: fieldInfo,
  });
  for (const file of generateVectors(sources, {
    version: version,
    production: production,
    srcdir: 'data',
    destdir: 'dist/vector',
  })) {
    // Set key = destination path as it is unique across versions
    vectorFiles.set(file.dest, file.src);
  }
  if (catalogueManifest) {
    mkdirp.sync(path.join('./dist/catalogue', version));
    fs.writeFileSync(
      path.join('./dist/catalogue', version, 'manifest'),
      JSON.stringify(catalogueManifest)
    );
  }
  if (vectorManifest) {
    mkdirp.sync(path.join('./dist/vector', version));
    fs.writeFileSync(
      path.join('./dist/vector', version, 'manifest'),
      JSON.stringify(vectorManifest)
    );
  }
}
for (const file of vectorFiles) {
  // file is an array of [dest, src]
  const vector = JSON.parse(fs.readFileSync(file[1]));
  //eslint-disable-next-line no-prototype-builtins
  const vectorToWrite = vector.hasOwnProperty('type')
      && vector.type === 'FeatureCollection'
      && constants.GEOJSON_RFC7946 !== undefined
    ? rewind(vector, constants.GEOJSON_RFC7946 === false)
    : vector;
  fs.writeFileSync(file[0], JSON.stringify(vectorToWrite), 'utf8');
}

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const Hjson = require('hjson');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const { generateVectorManifest, generateCatalogueManifest } = require('./scripts/generate-manifest');
const generateVectors = require('./scripts/generate-vectors');
const constants = require('./scripts/constants');

const tileManifestHostname = process.env.TILE_HOST || constants.TILE_STAGING_HOST;
const vectorManifestHostname = process.env.VECTOR_HOST || constants.VECTOR_STAGING_HOST;
const production = vectorManifestHostname === constants.VECTOR_PRODUCTION_HOST;

const sources = glob.sync('sources/**/*.*json').map(source => {
  const f = fs.readFileSync(source, 'utf8');
  return Hjson.parse(f);
});

// Clean and recreate `./dist` directories
rimraf.sync('./dist');
mkdirp.sync('./dist/vector/blob');
mkdirp.sync('./dist/vector/files');
mkdirp.sync('./dist/catalogue');

const vectorFiles = new Map();

for (const version of constants.VERSIONS) {
  mkdirp.sync(path.join('./dist/catalogue', version));
  mkdirp.sync(path.join('./dist/vector', version));
  const catalogueManifest = generateCatalogueManifest({
    version: version,
    tileHostname: tileManifestHostname,
    vectorHostname: vectorManifestHostname,
  });
  const vectorManifest = generateVectorManifest(sources, {
    version: version,
    production: production,
    hostname: vectorManifestHostname,
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
  fs.writeFileSync(
    path.join('./dist/catalogue', version, 'manifest'),
    JSON.stringify(catalogueManifest, null, 2)
  );
  fs.writeFileSync(
    path.join('./dist/vector', version, 'manifest'),
    JSON.stringify(vectorManifest, null, 2)
  );
}

for (const file of vectorFiles) {
  // file is an array of [dest, src]
  fs.copyFileSync(file[1], file[0]);
}

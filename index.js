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
const generateManifest = require('./scripts/generate-manifest');
const generateVectors = require('./scripts/generate-vectors');
const constants = require('./scripts/constants');

const manifestHostname = process.env.TARGET_HOST || constants.STAGING_HOST;
const production = manifestHostname === constants.PRODUCTION_HOST;

const sources = glob.sync('sources/**/*.*json').map(source => {
  const f = fs.readFileSync(source, 'utf8');
  return Hjson.parse(f);
});

// Clean and recreate `./dist` directories
rimraf.sync('./dist');
mkdirp.sync('./dist/blob');
mkdirp.sync('./dist/files');

const vectorFiles = new Map();

for (const version of constants.VERSIONS) {
  mkdirp.sync(path.join('./dist', version));
  const manifest = generateManifest(sources, {
    version: version,
    production: production,
    hostname: manifestHostname,
  });
  for (const file of generateVectors(sources, {
    version: version,
    production: production,
    srcdir: 'data',
    destdir: 'dist',
  })) {
    // Set key = destination path as it is unique across versions
    vectorFiles.set(file.dest, file.src);
  }
  fs.writeFileSync(
    path.join('./dist', version, 'manifest'),
    JSON.stringify(manifest, null, 2)
  );
}

for (const file of vectorFiles) {
  // file is an array of [dest, src]
  fs.copyFileSync(file[1], file[0]);
}

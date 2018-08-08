const Hjson = require('hjson');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
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

const vectorFiles = [];

constants.VERSIONS.forEach(version => {
  mkdirp.sync(path.join('./dist', version));
  const manifest = generateManifest(sources, {
    version: version,
    production: production,
    hostname: manifestHostname,
  });
  vectorFiles.push(generateVectors(sources, {
    version: version,
    production: production,
    srcdir: 'data',
    destdir: 'dist',
  }));
  fs.writeFileSync(
    path.join('./dist', version, 'manifest'),
    JSON.stringify(manifest, null, 2)
  );
});

// Flatten the vectorFiles array and remove duplicate files (used by more than one version) before copying
const filesToCopy = _.uniqBy(_.flatten(vectorFiles), 'dest');
filesToCopy.forEach(file => {
  fs.copyFileSync(file.src, file.dest);
});

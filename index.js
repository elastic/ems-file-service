const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const generateManifest = require('./scripts/generate-manifest');
const generateVectors = require('./scripts/generate-vectors');

const VERSIONS = ['v1', 'v2'];
const production = process.env.TARGET_HOST === 'vector.maps.elastic.co'

VERSIONS.forEach(version => {
  mkdirp.sync(path.join('./dist', version));
  const manifest = generateManifest(version, production);
  fs.writeFileSync(
    path.join('./dist', version, 'manifest'),
    JSON.stringify(manifest, null, 2)
  );
});

generateVectors(production);

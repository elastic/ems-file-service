const Hjson = require('hjson');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const generateManifest = require('./scripts/generate-manifest');
const generateVectors = require('./scripts/generate-vectors');

const VERSIONS = ['v1', 'v2'];
const manifestHostname = process.env.TARGET_HOST || 'staging-dot-elastic-layer.appspot.com';
const production = manifestHostname === 'vector.maps.elastic.co';
const sources = glob.sync('sources/**/*.*json').map(source => {
  const f = fs.readFileSync(source, 'utf8');
  return Hjson.parse(f);
});

VERSIONS.forEach(version => {
  mkdirp.sync(path.join('./dist', version));
  const manifest = generateManifest(sources, {
    version: version,
    production: production,
    hostname: manifestHostname
  });
  fs.writeFileSync(
    path.join('./dist', version, 'manifest'),
    JSON.stringify(manifest, null, 2)
  );
});

generateVectors(sources, {
  production: production,
  srcdir: 'data',
  destdir: 'dist'
});

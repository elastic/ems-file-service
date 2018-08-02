const Hjson = require('hjson');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const semver = require('semver');

module.exports = generateVectors;

function generateVectors(production) {
  return glob.sync('sources/**/*.*json').forEach(generateVectorFile, { production: production });
}

function generateVectorFile(source) {
  const f = fs.readFileSync(source, 'utf8');
  const data = Hjson.parse(f);
  mkdirp.sync('./dist/files');
  const src = data.filename;
  const dest = data.filename;
  if ((this.production && data.production) || !this.production) {
    try {
      fs.copyFileSync(
        path.join('./data', src),
        path.join('./dist', 'files', dest)
      );
    } catch (err) {
      return err;
    }
    if (semver.intersects('1 - 2', data.versions)) {
      generateLegacyGeojson(data);
    }
  }
}

function generateLegacyGeojson(data) {
  mkdirp.sync('./dist/blob');
  const src = data.filename;
  const dest = data.id;
  try {
    fs.copyFileSync(
      path.join('./data', src),
      path.join('./dist', 'blob', dest.toString())
    );
  } catch (err) {
    return err;
  }
}

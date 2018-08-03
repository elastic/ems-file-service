const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const semver = require('semver');

module.exports = generateVectors;

/**
 *
 * @param {Object[]} sources - An array of layer objects
 * @param {Object} [opts]
 * @param {string} [opts.srcdir='data'] - Relative directory of source vector data
 * @param {string} [opts.destdir='dist'] - Copy source vector data to this folder
 */
function generateVectors(sources, opts = {
  production: false,
  srcdir: 'data',
  destdir: 'dist'
}) {
  sources.filter(data => {
    return (!opts.production || (opts.production && data.production));
  }).forEach(data => {
    const src = path.join(opts.srcdir, data.filename);
    const dest = path.join(opts.destdir, 'files', data.filename);
    try {
      copyVectorData(src, dest);
    } catch (err) {
      return err;
    }
    if (semver.intersects('1 - 2', data.versions)) {
      const destLegacy = path.join(opts.destdir, 'blob', data.id);
      try {
        copyVectorData(src, destLegacy);
      } catch (err) {
        return err;
      }
    }
  });
}

function copyVectorData(src, dest) {
  mkdirp.sync(dest);
  return fs.copyFileSync(src, dest);
}

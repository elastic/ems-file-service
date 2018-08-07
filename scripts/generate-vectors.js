const path = require('path');
const semver = require('semver');

module.exports = generateVectors;

/**
 * Create an array of source and destination directories for each layer. These can be passed to fs.copyFile.
 * @param {Object[]} sources - An array of layer objects
 * @param {Object} [opts]
 * @param {string} [opts.version='v0'] - Only include layers the satisfy this semver version
 * @param {boolean} [opts.production=false] - If true, include only production layers
 * @param {string} [opts.srcdir='data'] - Relative directory of source vector data
 * @param {string} [opts.destdir='dist'] - Relative directory of destination vector data
 */
function generateVectors(sources, {
  version = 'v0',
  production = false,
  srcdir = 'data',
  destdir = 'dist'
} = {}) {
  const files = [];
  const manifestVersion = semver.coerce(version);
  sources.filter(data => {
    return ((!production || (production && data.production)) && semver.satisfies(manifestVersion, data.versions));
  }).forEach(data => {
    const src = path.join(srcdir, data.filename);
    const dest = path.join(destdir, 'files', data.filename);
    files.push({ src: src, dest: dest });
    if (data.id) {
      const destLegacy = path.join(destdir, 'blob', data.id.toString());
      files.push({ src: src, dest: destLegacy });
    }
  });
  return files;
}

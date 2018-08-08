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
function generateVectors(sources, opts) {
  opts = {
    version: 'v0',
    production: false,
    srcdir: 'data',
    destdir: 'dist',
    ...opts
  };
  const files = [];
  const manifestVersion = semver.coerce(opts.version);
  for (const source of sources) {
    if ((!opts.production ||
      (opts.production && source.production))
      && semver.satisfies(manifestVersion, source.versions)) {
      const src = path.join(opts.srcdir, source.filename);
      const dest = path.join(opts.destdir, 'files', source.filename);
      files.push({ src: src, dest: dest });
      if (source.id) {
        const destLegacy = path.join(opts.destdir, 'blob', source.id.toString());
        files.push({ src: src, dest: destLegacy });
      }
    }
  }
  return files;
}

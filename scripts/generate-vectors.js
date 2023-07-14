/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const path = require('path');
const semver = require('semver');

const { coerceToSemVer } = require('./date-versions');

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
    ...opts,
  };
  const files = [];
  const manifestVersion = coerceToSemVer(opts.version);
  for (const source of sources) {
    if ((!opts.production ||
      (opts.production && source.production)) &&
      semver.satisfies(manifestVersion, source.versions)) {
      for (const format of source.emsFormats) {
        const src = path.join(opts.srcdir, format.file);
        const dest = path.join(opts.destdir, 'files', format.file);
        files.push({ src: src, dest: dest });
      }
      if (source.id) {
        const destLegacy = path.join(opts.destdir, 'blob', source.id.toString());
        const defaultFormat = source.emsFormats.filter(format => format.default).pop();
        files.push({ src: path.join(opts.srcdir, defaultFormat.file), dest: destLegacy });
      }
    }
  }
  return files;
}

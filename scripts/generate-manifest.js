/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const semver = require('semver');
const _ = require('lodash');
const constants = require('./constants');

module.exports = {
  generateVectorManifest,
  generateCatalogueManifest,
};

/**
 * Generate a catalogue manifest for a specific version of Elastic Maps Service
 * @param {Object} [opts]
 * @param {string} [opts.version='v0'] - Version of vector file manifest to link to
 * @param {string} [opts.tileHostname=`${constants.TILE_STAGING_HOST}`] - Hostname for tile manifest
 * @param {string} [opts.vectorHostname=`${constants.VECTOR_STAGING_HOST}`] - Hostname for files manifest
 */
function generateCatalogueManifest(opts) {
  opts = {
    version: 'v0',
    tileHostname: constants.TILE_STAGING_HOST,
    vectorHostname: constants.VECTOR_STAGING_HOST,
    ...opts,
  };
  if (!semver.valid(semver.coerce(opts.version))) {
    throw new Error('A valid version parameter must be defined');
  }
  const manifest = {
    services: [{
      id: 'tiles_v2',
      name: 'Elastic Maps Tile Service',
      manifest: `https://${opts.tileHostname}/v2/manifest`,
      type: 'tms',
    }, {
      id: 'geo_layers',
      name: 'Elastic Maps Vector Service',
      manifest: `https://${opts.vectorHostname}/${opts.version}/manifest`,
      type: 'file',
    }],
  };
  return manifest;
}

/**
 * Generate a vector manifest for a specific version
 * @param {Object[]} sources - An array of layer objects
 * @param {Object} [opts]
 * @param {string} [opts.version='0'] - Only include layers that satisfy this semver version
 * @param {boolean} [opts.production=false] - If true, include only production layers
 * @param {string} [opts.hostname=`${constants.VECTOR_STAGING_HOST}`] - Hostname for files in manifest
 */
function generateVectorManifest(sources, opts) {
  opts = {
    version: 'v0',
    production: false,
    hostname: constants.VECTOR_STAGING_HOST, ...opts,
  };
  if (!semver.valid(semver.coerce(opts.version))) {
    throw new Error('A valid version parameter must be defined');
  }
  const manifestVersion = semver.coerce(opts.version);
  const layers = [];
  for (const source of sources) {
    if ((!opts.production ||
      (opts.production && source.production)) &&
      semver.satisfies(manifestVersion, source.versions)) {
      switch (semver.major(manifestVersion)) {
        case 1:
          layers.push(manifestLayerV1(source, opts.hostname));
          break;
        case 2:
          layers.push(manifestLayerV2(source, opts.hostname));
          break;
      }
    }
  }
  for (const prop of ['name', 'id']) {
    throwIfDuplicates(layers, prop);
  }

  const manifest = {
    layers: _.orderBy(layers, ['weight', 'name'], ['desc', 'asc']),
  };
  return manifest;
}

function throwIfDuplicates(array, prop) {
  const uniqueNames = _.groupBy(array, prop);
  for (const key of Object.getOwnPropertyNames(uniqueNames)) {
    if (uniqueNames[key].length > 1) {
      throw new Error(`${key} has duplicate ${prop}`);
    }
  }
  return false;
}

function manifestLayerV1(data, hostname) {
  const manifestId = data.id || data.filename;
  const urlPath = data.id ? `blob/${data.id}` : `files/${data.filename}`;
  const layer = {
    attribution: data.attribution,
    weight: data.weight,
    name: data.humanReadableName,
    url: `https://${hostname}/${urlPath}?elastic_tile_service_tos=agree`,
    format: data.conform.type,
    fields: data.fieldMapping.map(fieldMap => ({
      name: fieldMap.dest,
      description: fieldMap.desc,
    })),
    created_at: data.createdAt,
    tags: [],
    id: manifestId,
  };
  return layer;
}

function manifestLayerV2(data, hostname) {
  const layer = manifestLayerV1(data, hostname);
  if (layer.format === 'topojson') {
    layer.meta = {
      feature_collection_path: 'data',
    };
  }
  return layer;
}

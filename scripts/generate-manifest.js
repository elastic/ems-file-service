const semver = require('semver');
const _ = require('lodash');

module.exports = generateManifest;

/**
 * Generate a manifest for a specific version
 * @param {Object[]} sources - An array of layer objects
 * @param {Object} [opts]
 * @param {string} [opts.version='0'] - Only include layers the satisfy this semver version
 * @param {boolean} [opts.production=false] - If true, include only production layers
 * @param {string} [opts.hostname=staging-dot-elastic-layer.appspot.com] - Hostname for files in manifest
 */
function generateManifest(sources, opts = { version: '0', production: false, hostname: 'staging-dot-elastic-layer.appspot.com' }) {
  const version = opts.version;
  const production = opts.production
  const hostname = opts.hostname
  if (!semver.valid(semver.coerce(version))) {
    return new Error('A valid version parameter must be defined');
  }
  const manifestVersion = semver.coerce(version);
  const layers = sources.filter(data => {
    return ((!production || (production && data.production)) && semver.satisfies(manifestVersion, data.versions))
  }).map(data => {
    switch (semver.major(manifestVersion)) {
      case 1:
        return manifestLayerV1(data, hostname);
      case 2:
        return manifestLayerV2(data, hostname);
      default:
        return null
    }
  })
  const manifest = {
    layers: _.orderBy(layers, ['weight', 'name'], ['desc', 'asc']),
  };
  return manifest;
}

function manifestLayerV1(data, hostname) {
  const manifestId = data.id;
  const layer = {
    attribution: data.attribution,
    weight: data.weight,
    name: data.humanReadableName,
    url: `https://${hostname}/blob/${manifestId}?elastic_tile_service_tos=agree`,
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

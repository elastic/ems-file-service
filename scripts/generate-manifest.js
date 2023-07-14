/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const semver = require('semver');
const _ = require('lodash');
const { readFileSync } = require('fs');
const constants = require('./constants');
const {
  coerceToSemVer,
  coerceToDateSemver,
  checkDateVersion,
} = require("./date-versions");

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

  // Get the Semantic Version (in case it is date based)
  const version = coerceToSemVer(opts.version);

  //Catalogue manifest was removed in 7.6+
  if (semver.gte(version, '7.6.0')) {
    return;
  }
  const tilesManifest = semver.lt(version, '7.2.0')
    ? { id: 'tiles_v2', version: 'v2' }
    : { id: 'tiles', version: 'v7.2' };
  const manifest = {
    version: `${version.major}.${version.minor}`,
    services: [{
      id: tilesManifest.id,
      name: 'Elastic Maps Tile Service',
      manifest: `https://${opts.tileHostname}/${tilesManifest.version}/manifest`,
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
 * @param {Object} [opts.fieldInfo=null] - Field metadata
 */
function generateVectorManifest(sources, opts) {
  opts = {
    version: 'v0',
    production: false,
    hostname: constants.VECTOR_STAGING_HOST,
    fieldInfo: null,
    dataDir: 'data',
    ...opts,
  };

  const isDateVersion = checkDateVersion(opts.version);

  // Get the Semantic Version (in case it is date based)
  const manifestVersion = coerceToSemVer(opts.version);
  const layers = [];
  const uniqueProperties = [];
  for (const source of _.orderBy(sources, ['weight', 'name'], ['desc', 'asc'])) {
    if (!semver.validRange(source.versions)) {
      throw new Error(`Invalid versions specified for ${source.name}`);
    }
    if ((!opts.production ||
      (opts.production && source.production)) &&
      semver.satisfies(manifestVersion, source.versions)) {
      switch (semver.major(manifestVersion)) {
        case 1:
          uniqueProperties.push('name', 'id');
          layers.push(manifestLayerV1(source, opts.hostname, { manifestVersion }));
          break;
        case 2:
          uniqueProperties.push('name', 'id');
          layers.push(manifestLayerV2(source, opts.hostname, { manifestVersion }));
          break;
        case 6:
        case 7:
        case 8: // v6, v7, and v8 manifest schema are the same
          uniqueProperties.push('layer_id');
          layers.push(manifestLayerV6(source, opts.hostname, { manifestVersion, fieldInfo: opts.fieldInfo, dataDir: opts.dataDir }));
          break;
        default:
          throw new Error(`Unable to get a manifest for version ${manifestVersion}`);
      }
    }
  }
  for (const prop of uniqueProperties) {
    throwIfDuplicates(layers, prop);
  }

  const manifest = {
    version: isDateVersion
      // Get the Date Version
      ? coerceToDateSemver(opts.version)?.date
      // Get the Semantic Version
      : `${semver.major(manifestVersion)}.${semver.minor(manifestVersion)}`,
    layers: layers,
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

function manifestLayerV1(data, hostname, opts) {
  const format = getDefaultFormat(data.emsFormats);
  const pathname = `/blob/${data.id}`;
  const layer = {
    attribution: data.attribution.map(getAttributionString).join('|'),
    weight: data.weight,
    name: data.humanReadableName.en,
    url: getFileUrl(hostname, pathname, opts.manifestVersion),
    format: format.type,
    fields: data.fieldMapping
      .filter(fieldMap => ['id', 'property'].includes(fieldMap.type))
      .map(fieldMap => ({
        name: fieldMap.name,
        description: fieldMap.desc,
      })),
    created_at: data.createdAt,
    tags: [],
    id: data.id,
  };
  return layer;
}

function manifestLayerV2(data, hostname, opts) {
  const layer = manifestLayerV1(data, hostname, opts);
  const format = getDefaultFormat(data.emsFormats);
  if (format.type === 'topojson') {
    layer.meta = {
      feature_collection_path: _.get(format, 'meta.feature_collection_path', 'data'),
    };
  }
  return layer;
}

function manifestLayerV6(data, hostname, { manifestVersion, fieldInfo, dataDir }) {
  const formats = data.emsFormats.map(format => {
    const pathname = `/files/${format.file}`;
    return { ...{
      type: format.type,
      url: getFileUrl(hostname, pathname, manifestVersion),
      legacy_default: format.default || false,
    }, ...(format.meta && { meta: format.meta }) };
  });
  const idFields = data.fieldMapping.filter(field => field.type === 'id');
  const { file } = getDefaultFormat(data.emsFormats);
  const idInfos = getIdsFromFile(dataDir, file, idFields);
  const fields = getFieldMapping(data.fieldMapping, manifestVersion, idInfos, fieldInfo);
  const layer = {
    layer_id: data.name,
    created_at: data.createdAt,
    attribution: data.attribution,
    formats,
    fields: fields,
    legacy_ids: data.legacyIds,
    layer_name: data.humanReadableName,
  };
  return layer;
}

function getDefaultFormat(emsFormats) {
  return emsFormats.find(format => format.default);
}

function getIdsFromFile(dataDir, file, fields) {
  const fieldMap = {};
  const fieldsWithIds = fields.filter(field => !field.skipCopy);

  if (fieldsWithIds.length == 0) return fieldMap;

  // Only read the dataset if there are identfiers to return
  const json = JSON.parse(readFileSync(`${dataDir}/${file}`, 'utf8'));
  const features = json.features || json.objects.data.geometries;
  for (const { name } of fieldsWithIds) {
    fieldMap[name] = new Set(); // Probably unnecessary but ensures unique ids
  }
  for (const feature of features) {
    for (const { name } of fieldsWithIds) {
      fieldMap[name].add(feature.properties[name]);
    }
  }
  return fieldMap;
}

/**
 * Get localized labels for the field. Field names starting with `label_` are assumed to be
 * followed by an ISO 639 language code and the field name is mapped to the `name.18n` property
 * in `fieldInfo`. Otherwise, field names are mapped to the matching property in `fieldInfo`.
 * @private
 * @param {string} fieldName Name of the field in the source vector file
 * @param {Object} fieldInfo Metadata about all available fields
 * @param {Object.<string, string>} fieldInfo.i18n Each key is an ISO 639 language code and
 * the value is the field translation
 * @returns {Object.<string, string>}
 * @example
 * // returns { en: 'name (en)', fr: 'nom (en) }
 * getFieldLabels('label_en', { name: { i18n: { en: 'name', fr: 'nom' } } });
 * @example
 * // returns { en: 'Dantai code', fr: 'code dantai' }
 * getFieldLabels('dantai', { dantai: { i18n: { en: 'Dantai code', fr: 'code dantai' } } });
 */
function getFieldLabels(fieldName, fieldInfo) {
  if (fieldName.startsWith('label_') && _.get(fieldInfo, 'name.i18n')) {
    const lang = fieldName.replace('label_', '');
    const labels = _.mapValues(fieldInfo.name.i18n, label => `${label} (${lang})`);
    return labels;
  } else if (_.get(fieldInfo, `${fieldName}.i18n`)) {
    return fieldInfo[fieldName].i18n;
  } else {
    return;
  }
}

/**
 * Get label or Markdown href string for v1 and v2 manifests
 * @private
 * @param {Object} attr Localized attribution
 * @param {string} attr.label Attribution label
 * @param {string} [attr.url] URL link to attribution (optional)
 * @returns {string}
 */
function getAttributionString(attr) {
  if (!attr.label) {
    throw new Error(`Attribution sources must have a 'label' property`);
  }
  return attr.url ? `[${attr.label.en}](${attr.url.en})` : `${attr.label.en}`;
}

/**
 * Get a file url for a vector manifest.
 * EMS versions <7.6 include the full URL and query string. At EMS v7.6,
 * URLs are relative to the manifest hostname and the query string must be
 * applied by the client.
 * @private
 * @param {string} hostname
 * @param {string} pathname
 * @param {string} manifestVersion
 * @returns {string}
 */
function getFileUrl(hostname, pathname, manifestVersion) {
  if (semver.lt(manifestVersion, '7.6.0')) {
    return `https://${hostname}${pathname}?elastic_tile_service_tos=agree`;
  } else {
    return `${pathname}`;
  }
}

function getFieldMapping(sourceFieldsMap, manifestVersion, idInfos, fieldInfo) {
  const supportsFieldMeta = semver.gte(manifestVersion, '7.14.0');
  return sourceFieldsMap
    .filter(sourceFieldMap => ['id', 'property'].includes(sourceFieldMap.type))
    .map(sourceFieldMap => {
      const { type, name, desc, regex, alias, skipCopy } = sourceFieldMap;
      const values = type === 'id' && !skipCopy ? [...idInfos[name]] : undefined;
      return {
        type,
        id: name,
        label: { ...{ en: desc }, ...getFieldLabels(name, fieldInfo) },
        ...(supportsFieldMeta && regex && ({ regex })),
        ...(supportsFieldMeta && alias && ({ alias })),
        ...(supportsFieldMeta && values && ({ values })),
      };
    });
}

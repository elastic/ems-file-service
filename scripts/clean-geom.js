/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const jsts = require('jsts');
const fs = require('fs');
const rewind = require('geojson-rewind');

const filePath = process.argv[2];

if (!filePath) {
  throw new Error(`Add the GeoJSON file path to clean. e.g. node scripts/clean-geom.js data/usa_states_v1.geo.json`);
}

function makeValid(feature) {
  const writer = new jsts.io.GeoJSONWriter();
  const newFeature = {
    type: 'Feature',
    geometry: null,
    properties: feature.properties,
  };
  if (feature.id) newFeature.id = feature.id;
  if (feature.geometry === null) {
    return;
  } else if (!feature.geometry.isSimple() || !feature.geometry.isValid()) {
    const geom = feature.geometry.buffer(0);
    newFeature.geometry = writer.write(geom);
    return newFeature;
  } else {
    newFeature.geometry = writer.write(feature.geometry);
    return;
  }
}

const reader = new jsts.io.GeoJSONReader();

const fc = fs.readFileSync(filePath, 'utf8');
const gj = reader.read(fc);
// Filter out null geometries
const features = gj.features.map(makeValid).filter(Boolean);

// JSTS does not enforce winding order, so we pass the features through `geojson-rewind`
// to wind them in clockwise order.
const fixed = rewind({
  type: 'FeatureCollection',
  features: features,
}, true);

fs.writeFileSync(filePath, JSON.stringify(fixed));

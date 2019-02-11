/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const jsts = require('jsts');
const fs = require('fs');
const rewind = require('geojson-rewind');
const stringify = require('json-stringify-pretty-compact');

function cleanGeom(geojson, ...{ wind = 'clockwise' }) {
  const reader = new jsts.io.GeoJSONReader();

  const gj = reader.read(geojson);
  const features = gj.features.map(makeValid);

  // JSTS does not enforce winding order, so we pass the features through `geojson-rewind`
  // to wind them (clockwise by default, otherwise counterclockwise).
  const fixed = rewind({
    type: 'FeatureCollection',
    features: features,
  }, wind === 'clockwise');
  return fixed;
}

function makeValid(feature) {
  const precisionModel = new jsts.geom.PrecisionModel(1000000);
  const precisionReducer = new jsts.precision.GeometryPrecisionReducer(precisionModel);
  const writer = new jsts.io.GeoJSONWriter();
  const newFeature = {
    type: 'Feature',
    geometry: null,
    properties: feature.properties,
  };
  if (feature.id) newFeature.id = feature.id;
  let geom;
  if (!feature.geometry.isSimple() || !feature.geometry.isValid()) {
    geom = precisionReducer.reduce(feature.geometry.buffer(0));
  } else {
    geom = precisionReducer.reduce(feature.geometry);
  }
  newFeature.geometry = writer.write(geom);
  return newFeature;
}

module.exports = cleanGeom;

if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(`Add the GeoJSON file path to clean. e.g. node scripts/clean-geom.js data/usa_states_v1.geo.json`);
  }

  const fc = fs.readFileSync(filePath, 'utf8');
  const fixed = cleanGeom(fc);
  const output = stringify(fixed, { indent: 2 });

  fs.writeFileSync(filePath, output);

}

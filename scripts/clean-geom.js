/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";

import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import IsSimpleOp from "jsts/org/locationtech/jts/operation/IsSimpleOp.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";

import rewind from "geojson-rewind";
import yargs from "yargs";

yargs(process.argv.slice(2))
  .version()
  .option('verbose', {
    alias: 'v',
    default: false,
    type: 'boolean',
    describe: 'Log about the process',
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    describe: 'Write the output GeoJSON in a different path',
  })
  .demandCommand(1)
  .epilog('Elastic, 2019')
  .example('$0 in.geojson', 'Overwrites your file')
  .example('$0 -o fix.geojson in.geojson', 'Leaves your input file as is');

const argv =  yargs.argv;

const filePath = argv._[0];

function log(message) {
  if (argv.verbose) {
    console.log(message);
  }
}

if (!filePath) {
  throw new Error(`Add the GeoJSON file path to clean. e.g. node scripts/clean-geom.js data/usa_states_v1.geo.json`);
} else {
  log('Processing ' + filePath);
}

function makeValid(feature) {
  const writer = new GeoJSONWriter();
  const newFeature = {
    type: 'Feature',
    geometry: null,
    properties: feature.properties,
  };
  if (feature.id) newFeature.id = feature.id;

  const isSimple = new IsSimpleOp(feature.geometry);
  const isValid = new IsValidOp(feature.geometry);

  if (!isSimple.isSimple() || !isValid.isValid()) {

    if (!feature.geometry.isValid()) {
      log(`Feature [${feature.id}] is invalid`);
    }

    const geom = feature.geometry.buffer(0);

    if (geom.getArea() === 0) {
      log(`New geometry is empty!!`);
    }

    newFeature.geometry = writer.write(geom);
  } else {
    newFeature.geometry = writer.write(feature.geometry);
  }
  return newFeature;
}

const reader = new GeoJSONReader();

try {
  const fc = fs.readFileSync(filePath, 'utf8');
  const gj = reader.read(fc);

  log(`Checking ${gj.features.length} features`);
  const features = gj.features.map(makeValid);

  // JSTS does not enforce winding order, so we pass the features through `geojson-rewind`
  // to wind them in clockwise order.
  const fixed = rewind({
    type: 'FeatureCollection',
    features: features,
  }, true);

  const outputPath = argv.output || filePath;
  log(`Writing results to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(fixed));
} catch (error) {
  log('Error processing your file');
  log(error);
  process.exit(1);
}

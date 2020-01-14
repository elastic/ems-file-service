/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const fs = require('fs');
const _ = require('lodash');
const jsts = require('jsts');
const distance = require('turf-vincenty-inverse');

/* Command line options definition */
const yargs = require('yargs')
  .version()
  .scriptName('layerdiff')
  .help()
  .alias('h', 'help')
  .option('verbose', {
    alias: 'v',
    default: 0,
    count: true,
    describe: 'Verbosity (0 to 2), -vv for full output',
  })
  .option('field-id', {
    alias: 'i',
    type: 'string',
    describe: 'Use a property as identifier, by default the id from the feature will be used',
  })
  .option('check-id', {
    alias: 'c',
    type: 'string',
    nargs: 1,
    describe: 'Check a single feature with the provided ID',
  })
  .option('area-diff', {
    alias: 'a',
    type: 'number',
    nargs: 1,
    default: 1,
    describe: 'Area percentage difference to trigger an alert',
  })
  .option('centroid-dist', {
    alias: 'd',
    type: 'number',
    nargs: 1,
    default: 1000,
    describe: 'Distance in meters of the centroids that trigger an alert',
  })
  .option('no-parts', {
    alias: 'n',
    type: 'boolean',
    default: false,
    describe: 'Disable to compare the number of parts on multipolygons',
  })
  .demandCommand(2)
  .example('$0 old.geojson new.geojson', 'Compare two files')
  .example('$0 -i INSEE old new', 'Compare using a custom property')
  .example('$0 -c Q43121 old new', 'Compare given ID feature')
  .epilog('Elastic, 2020');
const argv = yargs.argv;



/* Logging options */
const VERBOSE_LEVEL = argv.verbose;
function warn() { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
function info() { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
function debug() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }

function warnTable() { VERBOSE_LEVEL >= 0 && console.table.apply(console, arguments); }
// function infoTable() { VERBOSE_LEVEL >= 1 && console.table.apply(console, arguments); }
function debugTable() { VERBOSE_LEVEL >= 2 && console.table.apply(console, arguments); }

info('Comparing files...');

const fieldId = argv.fieldId;
const getId = function (f) {
  return fieldId ? f.properties.id : f.id;
};

const toFeaturePoint = function (geom) {
  const { x, y } = geom.getCoordinates()[0];
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [x, y],
    },
  };
};

/* Compare two features */
const compareFeatures = function ({ id, left, right }) {
  info(`${id}:`);
  // Deep comparison of properties using lodash
  if (!_.isEqual(left.properties, right.properties)) {
    warn('Properties are not equal');
    warnTable([
      { file: 'left', ...left.properties },
      { file: 'right', ...right.properties },
    ]);
  } else {
    if (VERBOSE_LEVEL >= 2) {
      debugTable([
        { file: 'left', ...left.properties },
        { file: 'right', ...right.properties },
      ]);
    }
  }

  // Geometry check
  const lGeom = left.geometry;
  const rGeom = right.geometry;

  // Area check
  const lArea = lGeom.getArea();
  const rArea = rGeom.getArea();
  const areaDiff = Math.abs((1 - lArea / rArea) * 100);

  if (areaDiff > argv.areaDiff) {
    warn('Areas differ too much', areaDiff.toFixed(3), '%');
  } else {
    if (VERBOSE_LEVEL >= 2) {
      debug('Area diff: ', areaDiff.toFixed(3), '%');
    }
  }

  // Centroid check
  const lCentroid = toFeaturePoint(lGeom.getCentroid());
  const rCentroid = toFeaturePoint(rGeom.getCentroid());
  const centroidDist = Math.floor(distance(lCentroid, rCentroid, 'radians'));
  if (centroidDist > argv.centroidDist) {
    warn('Distance between centroids is too high: ', centroidDist, 'm');
  } else {
    if (VERBOSE_LEVEL >= 2) {
      debug('Distance between centroids: ', centroidDist, 'm');
    }
  }

  // Parts check
  // TO DO

  // TO DO: gather all the checks in a single report for better control of the output

};
const leftPath = argv._[0];
const rightPath = argv._[1];

try {

  const reader = new jsts.io.GeoJSONReader();

  const leftJson = reader.read(fs.readFileSync(leftPath, 'utf-8'));
  const rightJson = reader.read(fs.readFileSync(rightPath, 'utf-8'));

  debug(leftPath, leftJson.features.length, 'features');
  debug(rightPath, rightJson.features.length, 'features');

  let features = [];
  const notLeft = [];

  if (argv.checkId) {
    // Find the elements directly  by the provided ID
    const id = argv.checkId;
    const left = leftJson.features.find(f => getId(f) === id);
    const right = rightJson.features.find(f => getId(f) === id);

    if (left && right) {
      features.push({ id, left, right });
    } else {
      if (!left) {
        warn('ID not found in the left GeoJSON');
      }
      if (!right) {
        warn('ID not found in the right GeoJSON');
      }
      yargs.exit(0);
    }
  } else {
    // Join the two arrays merging by the id

    // Put all the left features in a new object
    features = leftJson.features.map(f => {
      const id = getId(f);
      return {
        id,
        left: f,
      };
    });

    // Put all the right features in the main object
    // and save the ones that are not found for later
    rightJson.features.forEach(f => {
      const id = getId(f);
      const fIndex = features.findIndex(ff => ff.id === id);
      if (fIndex === -1) {
        notLeft.push(f);
      } else {
        features[fIndex].right = f;
      }
    });
  }



  // Find if there are any features from the left
  // without the right side
  const notRight = features.filter(f => !'right' in f);

  if (notRight.length > 0) {
    const ids = notRight.map(getId);
    warn('Missing IDs on the right file:', ids.join(', '));
  }
  if (notLeft.length > 0) {
    const ids = notLeft.map(getId);
    warn('Missing IDs on the left file:', ids.join(', '));
  }

  // Remove from features any
  const finalFeatures = features.filter(f => 'right' in f);
  debug('Features to compare: ', finalFeatures.length);
  finalFeatures.forEach(compareFeatures);
  info('================================== Done!');

} catch (error) {
  warn(error);
  warn('Quiting');
  yargs.exit(0);
}


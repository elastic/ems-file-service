/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from 'node:fs';
import { isEqual, compact, values } from 'lodash-es';

import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader.js';
import Centroid  from 'jsts/org/locationtech/jts/algorithm/Centroid.js';

import { getDistance, getAreaOfPolygon } from 'geolib';
import yargs from 'yargs/yargs';


/* Command line options definition */
const argv = yargs(process.argv.slice(2))
  .version()
  .scriptName('layerdiff')
  .help()
  .alias('h', 'help')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    describe: 'More verbose output',
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
  .option('check-parts', {
    alias: 'p',
    type: 'boolean',
    default: false,
    describe: 'Enable to compare the number of parts on multipolygons',
  })
  .demandCommand(2)
  .example('$0 old.geojson new.geojson', 'Compare two files')
  .example('$0 -i INSEE old new', 'Compare using a custom property')
  .example('$0 -c Q43121 old new', 'Compare given ID feature')
  .epilog('Elastic, 2020')
  .argv;

/* Logging function */
function print() { console.log.apply(console, arguments); }

const VERBOSE = argv.verbose;
const FIELD_ID = argv.fieldId ? argv.fieldId.trim() : false;
const CHECK_ID = argv.checkId;
const AREA_DIFF = argv.areaDiff;
const CENTROID_DIST = argv.centroidDist;
const CHECK_PARTS = argv.checkParts;


const getId = function (f) {
  return FIELD_ID ? f.properties[FIELD_ID] : f.id;
};

const toFeaturePoint = function (geom) {
  return {
    latitude: geom.getY(),
    longitude: geom.getX(),
  };
};

const getAreaFromRing = function (ring) {
  const points = ring.getCoordinates().map(c => [c.x, c.y]);
  return getAreaOfPolygon(points);
};

const getArea = function (geom) {
  let totalArea = 0;
  for (let i = 0; i < geom.getNumGeometries(); i++) {
    const part = geom.getGeometryN(i);
    const ringArea = getAreaFromRing(part.getExteriorRing());

    let holeArea = 0;
    for (let j = 0; j < part.getNumInteriorRing(); j++) {
      const hole = part.getInteriorRingN(j);
      holeArea += getAreaFromRing(hole);
    }

    totalArea += ringArea - holeArea;
  }
  return totalArea;
};

/* Compare two features */
const compareFeatures = function ({ id, left, right }) {
  const diffs = {};
  const details = {};

  // Deep comparison of properties using lodash
  diffs.properties = !isEqual(left.properties, right.properties);

  // Geometry check
  const lGeom = left.geometry;
  const rGeom = right.geometry;

  // Area check
  const lArea = getArea(lGeom);
  const rArea = getArea(rGeom);
  const areaDiff = (1 - lArea / rArea) * 100;

  diffs.area = Math.abs(areaDiff) > AREA_DIFF;
  details.area = areaDiff;
  details.areas = {
    left: Math.round(lArea / 1e6) + " km²",
    right: Math.round(rArea / 1e6) + " km²",
  };

  // Centroid check
  const lCentroid = Centroid.getCentroid(lGeom);
  const rCentroid = Centroid.getCentroid(rGeom);

  const centroidDist = Math.floor(
    getDistance(toFeaturePoint(lCentroid), toFeaturePoint(rCentroid))
  );

  diffs.centroid = centroidDist > CENTROID_DIST;
  details.centroid = centroidDist;

  details.centroids = {
    left: `${lCentroid.getX()}, ${lCentroid.getY()}`,
    right: `${rCentroid.getX()}, ${rCentroid.getY()}`,
  };

  // Check parts

  const lParts = lGeom.getNumGeometries();
  const rParts = rGeom.getNumGeometries();
  details.parts = {
    left: lParts,
    right: rParts,
  };
  diffs.parts = CHECK_PARTS && lParts !== rParts;

  return {
    id,
    left,
    right,
    diffs,
    details,
  };
};

const reportDiffs = function ({ id, left, right, diffs, details }) {
  const numErrors = compact(values(diffs)).length;

  if (numErrors === 0 && !VERBOSE) {
    print(`Feature ${id} is OK ✔️`);
    return;
  } else {
    print(`\n---------------------------------- Feature ${id}`);
  }

  if (diffs.properties) {
    print('❌ Properties differ:');
    console.table({ left: left.properties, right: right.properties });
  } else if (VERBOSE) {
    print('✔️ Properties are OK');
    console.table([left.properties]);
  }

  if (diffs.area || VERBOSE) {
    const mark = diffs.area ? '❌' : '✔️';
    print(`${mark} Area difference: `, details.area.toFixed(2) + '%');
    if (VERBOSE > 0) {
      console.table(details.areas);
    }
  }

  if (diffs.centroid || VERBOSE) {
    const mark = diffs.centroid ? '❌' : '✔️';
    print(`${mark} Centroid distance:`, Math.round(details.centroid) + 'm');
    if (VERBOSE > 0) {
      console.table(details.centroids);
    }
  }

  if (diffs.parts || VERBOSE) {
    const mark = diffs.parts ? '❌' : '✔️';
    print(`${mark} Geometry parts: left: ${details.parts.left} right: ${details.parts.right}`);
  }

};


const splitFeatures = function (leftJson, rightJson) {
  let features = [];
  const notLeft = [];

  if (CHECK_ID) {
    // Find the elements directly  by the provided ID
    const id = CHECK_ID;
    const left = leftJson.features.find(f => getId(f) === id);
    const right = rightJson.features.find(f => getId(f) === id);

    if (left && right) {
      features.push({ id, left, right });
    } else {
      if (!left) {
        print('❌ ID not found in the left GeoJSON');
      }
      if (!right) {
        print('❌ ID not found in the right GeoJSON');
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
  //eslint-disable-next-line no-unsafe-negation
  const notRight = features.filter(f => !'right' in f);

  // Work only with features that are on both sides
  const finalFeatures = features.filter(f => 'right' in f);

  return {
    notLeft,
    notRight,
    features: finalFeatures,
  };
};

const pluralize = function (count, noun) {
  return `${count} ${noun}` + (count > 1 ? 's' : '');
};

// Execution starts here
try {
  // Report given parameters
  if (VERBOSE) {
    const fieldId = FIELD_ID ? 'property ' + FIELD_ID : 'default feature id';
    const checkId = CHECK_ID || 'none';
    print('================================== Parameters');
    print(`Identifier: ${fieldId}`);
    print(`Check a single feature id: ${checkId}`);
    print(`Area difference: ${AREA_DIFF}`);
    print(`Centroid distance: ${CENTROID_DIST}`);
    print(`Check parts: ${CHECK_PARTS}`);
  }

  const leftPath = argv._[0];
  const rightPath = argv._[1];

  const reader = new GeoJSONReader();

  // Load GeoJSON files
  print(`================================== Loading files...`);

  const [leftJson, rightJson] = [leftPath, rightPath].map(path =>{
    if (path === '-') {
      return reader.read(fs.readFileSync(0, 'utf-8'));
    } else {
      return reader.read(fs.readFileSync(path, 'utf-8'));
    }
  });

  if (VERBOSE) {
    console.table([
      { 'file': 'left', 'path': leftPath, 'features': leftJson.features.length },
      { 'file': 'right', 'path': rightPath, 'features': rightJson.features.length },
    ]);
  }

  // Check for IDs on both sides
  const { notLeft, notRight, features } = splitFeatures(leftJson, rightJson);

  print(`================================== IDs checked`);
  if (notRight.length > 0 || notLeft.length > 0) {
    print('The files don\'t have exactly the same number of features');
    if (notRight.length > 0) {
      const ids = notRight.map(getId);
      print('❌ Missing IDs on the right file:', ids.join(', '));
    }
    if (notLeft.length > 0) {
      const ids = notLeft.map(getId);
      print('❌ Missing IDs on the left file:', ids.join(', '));
    }
  } else {
    print(`✔️ All good`);
  }

  // Run the comparison checks
  print(`================================== Comparing ${pluralize(features.length, 'feature')}...`);
  const featuresWithDiffs = features.map(compareFeatures);
  const warnings = featuresWithDiffs.filter(f => compact(values(f.diffs)).length > 0);
  print(`${pluralize(warnings.length, 'difference')} detected`);

  // Report differences
  warnings.forEach(reportDiffs);

  print('================================== Done! ✔️');

} catch (error) {
  print(error);
  print('Quiting ❌');
  yargs.exit(0);
}


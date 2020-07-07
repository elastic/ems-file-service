/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tap = require('tap').test;
const Ajv = require('ajv');
const Hjson = require('hjson');
const schema = require('../schema/source_schema.json');
const glob = require('glob');
const fs = require('fs');
const jsts = require('jsts');
const _ = require('lodash');

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
const validate = ajv.compile(schema);

// Validate EMS source metadata and files
glob.sync('sources/**/*.*json').forEach((file) => {
  const source = Hjson.parse(fs.readFileSync(file, 'utf8'));
  testSourceSchema(source);
  testSourceFiles(source);
});

// Validate EMS source template
const template = Hjson.parse(fs.readFileSync('./templates/source_template.hjson', 'utf8'));
testSourceSchema(template);

// Validate test fixture metadata
glob.sync('test/fixtures/valid-sources/*.json').forEach(file => {
  const sources = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const source of sources) testSourceSchema(source);
});

function testSourceSchema(source) {
  const name = source.name;
  tap(`${name} schema must be valid`, (t) => {
    try {
      const valid = validate(source);
      t.ok(valid, `${name}: ${JSON.stringify(validate.errors)}`);
    } catch (err) {
      t.fail(`could not parse ${name} as JSON ${err}`);
    }
    t.end();
  });
}

function testSourceFiles(source) {
  tap(`${source.name} formats (${source.versions})`, (t) => {
    for (const format of source.emsFormats) {
      t.ok(fs.existsSync(`./data/${format.file}`), `${source.name} filename fields must have a matching file in the data directory`);
      const fieldNames = source.fieldMapping.map(f => f.name).sort();
      if (format.type === 'geojson') {
        const geojson = fs.readFileSync(`./data/${format.file}`, 'utf8');
        validateGeoJSON(geojson, fieldNames, t);
      } else if (format.type === 'topojson') {
        const topojson = fs.readFileSync(`./data/${format.file}`, 'utf8');
        validateObjectsMember(topojson, format, fieldNames, t);
      }
    }
    t.end();
  });
}

function validateObjectsMember(topojson, format, fieldsNames, t) {
  const fc = JSON.parse(topojson);
  const fcPath = _.get(format, 'meta.feature_collection_path', 'data');
  t.ok(fc.objects.hasOwnProperty(fcPath));
  t.type(fc.objects[fcPath], 'object');

  t.ok(fc.objects[fcPath].hasOwnProperty('geometries'));
  const geoms = fc.objects[fcPath].geometries;
  t.ok(geoms.every(
    geom => Object.keys(geom.properties).every(
      p => fieldsNames.indexOf(p) > -1)
  ), 'All feature properties are in the field mapping');

  if (process.env.EMS_STRICT_TEST) {
    t.ok(geoms.every(
      geom => {
        const keys = Object.keys(geom.properties).sort();
        return keys.every((p, i) => p === fieldsNames[i]);
      }
    ), 'Feature properties and field mapping are strictly aligned');
  }

}

function validateGeoJSON(geojson, fieldsNames, t) {
  const reader = new jsts.io.GeoJSONReader();
  const fc = reader.read(geojson);
  t.ok(fc.features.every(feat => feat.geometry.isSimple()
  ), 'All geometries must be simple');
  t.ok(fc.features.every(feat => feat.geometry.isValid()
  ), 'All geometries must be valid');

  t.ok(
    fc.features.every(
      feat => Object.keys(feat.properties).every(
        p => fieldsNames.indexOf(p) > -1)
    ), 'All feature properties are in the field mapping');


  if (process.env.EMS_STRICT_TEST) {
    t.ok(
      fc.features.every(
        feat => {
          const keys = Object.keys(feat.properties).sort();
          return keys.every((p, i) => p === fieldsNames[i]);
        }
      ), 'Feature properties and field mapping are strictly aligned');
  }
}

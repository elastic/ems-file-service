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
const topojson = require('topojson');
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
  tap(`${source.name} formats`, (t) => {
    for (const format of source.emsFormats) {
      t.ok(fs.existsSync(`./data/${format.file}`), `${source.name} filename fields must have a matching file in the data directory`);
      const vector = fs.readFileSync(`./data/${format.file}`, 'utf8');
      let featureCollection;
      if (format.type === 'geojson') {
        featureCollection = JSON.parse(vector);
      } else if (format.type === 'topojson') {
        const data = JSON.parse(vector);
        const fcPath = _.get(format, 'meta.feature_collection_path', 'data');
        validateObjectsMember(data, fcPath, t);
        const features = _.get(data, `objects.${fcPath}`);
        featureCollection = topojson.feature(data, features);
      } else {
        throw new Error(`Vector format ${format.type} is not supported`);
      }
      validateGeometry(featureCollection, t);
      validateFields(featureCollection, source.fieldMapping, t);
      t.end();
    }
  });
}

function validateObjectsMember(topo, fcPath, t) {
  t.ok(topo.objects.hasOwnProperty(fcPath));
  t.type(topo.objects[fcPath], 'object');
}

function validateGeometry(geojson, t) {
  const reader = new jsts.io.GeoJSONReader();
  const fc = reader.read(geojson);
  t.ok(fc.features.every(feat => feat.geometry.isSimple()
  ), 'All geometries must be simple');
  t.ok(fc.features.every(feat => feat.geometry.isValid()
  ), 'All geometries must be valid');
}

function validateFields(fc, fieldMapping, t) {
  for (const fieldMap of fieldMapping) {
    t.ok(fc.features.every(feat => feat.properties.hasOwnProperty(fieldMap.name)),
      `${fieldMap.name} must be present on every feature`);
  }
}

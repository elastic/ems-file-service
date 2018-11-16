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

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'), 'http://json-schema.org/draft-04/schema#');
testAllSources(ajv.compile(schema));

function testAllSources(validate) {
  glob.sync('sources/**/*.*json').forEach((source) => {
    const data = Hjson.parse(fs.readFileSync(source, 'utf8'));
    tap(`${source} schema must be valid`, (t) => {
      try {
        const valid = validate(data);

        t.ok(valid, `${source}: ${JSON.stringify(validate.errors)}`);
      } catch (err) {
        t.fail(`could not parse ${source} as JSON ${err}`);
      }
      t.end();
    });
    tap(`${source} filename field must have a matching file in the data directory`, (t) => {
      const sourceFilename = data.filename;
      t.ok(fs.existsSync(`./data/${sourceFilename}`));
      t.end();
    });
    if (data.conform.type === 'geojson') {
      tap(`${source} data must be valid and simple`, (t) => {
        const geojson = fs.readFileSync(`./data/${data.filename}`, 'utf8');
        validateGeometry(geojson, t);
      });
    }
  });
}

function validateGeometry(geojson, t) {
  const reader = new jsts.io.GeoJSONReader();
  const fc = reader.read(geojson);
  t.ok(fc.features.every(feat => feat.geometry.isSimple()
  ), 'All geometries must be simple');
  t.ok(fc.features.every(feat => feat.geometry.isValid()
  ), 'All geometries must be valid');
  t.end();
}

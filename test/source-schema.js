/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tape = require('tape');
const Ajv = require('ajv');
const Hjson = require('hjson');
const schema = require('../schema/source_schema.json');
const glob = require('glob');
const fs = require('fs');

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'), 'http://json-schema.org/draft-04/schema#');
testAllSources(ajv.compile(schema));

function testAllSources(validate) {
  glob.sync('sources/**/*.*json').forEach((source) => {
    tape(`${source} schema must be valid`, (t) => {
      try {
        const data = Hjson.parse(fs.readFileSync(source, 'utf8'));
        const valid = validate(data);

        t.ok(valid, `${source}: ${JSON.stringify(validate.errors)}`);
      } catch (err) {
        t.fail(`could not parse ${source} as JSON ${err}`);
      }
      t.end();
    });
  });
}

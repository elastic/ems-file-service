/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tap = require('tap').test;
const {
  generateCatalogueManifest,
  generateVectorManifest,
} = require('../scripts/generate-manifest');

const { getExpectedVector }= require('./manifest-v7.14');

const {
  formatDateToIso,
  checkDateVersion,
  coerceToDateSemver
} = require('../scripts/date-versions');

const sources = require('./fixtures/valid-sources/sources.json');
const fieldInfo = require('./fixtures/fieldInfo.json');
const constants = require('../scripts/constants');


tap('formatDateToIso', t=> {

  let validDate = '2023-12-31';
  t.same(validDate, formatDateToIso(new Date(validDate)),
    'Render a valid ISO date');

  let invalidDate = '2023-07-13T14:05:53+0200';
  t.same('2023-07-13', formatDateToIso(new Date(invalidDate)),
    'Reduce a full timestamp into a date only string');

  t.throws(function(){ formatDateToIso('foo') },{}, {skip: true},
    "Random string should throw an error");

  t.throws(function(){ formatDateToIso('2023') },{}, {skip: true},
    "Single year should throw an error");

  t.throws(function(){ formatDateToIso('2023-10') },{}, {skip: true},
    "Incomplete date should throw an error");

  t.throws(function(){ formatDateToIso('2023-15-13') },{}, {skip: true},
    "Invaild date should throw an error");

  t.end();
});


tap('checkDateVersion', t=> {
  ['2023-01-01', '1955-01-05','2053-05-05'].forEach(version => {
    t.ok(checkDateVersion(version),
      `Ensures ${version} is a valid date version`);
  });

  [
    '2023',
    'foo',
    '2023-01',
    '2023-13-31',
    '23-12-31',
    '2023-07-13T18:28:28+0200'
  ].forEach( version => {
    t.notOk(checkDateVersion(version),
      `Ensures ${version} is not a valid date version`);
  })

  t.end();
});


tap('date based tests', t => {

  // Get the first key of the DATE_VERSIONS object
  const validDate = constants.DATE_VERSIONS[0].date;

  // Try to generate a catalogue
  const catalogue = generateCatalogueManifest({
    version: validDate,
    tileHostname: 'tiles.maps.elstc.co',
    vectorHostname: 'vector.maps.elastic.co',
  });
  t.notOk(catalogue, `${validDate} catalogue should be falsy`);

  // Get a manifest
  const vector = generateVectorManifest(sources, {
    version: validDate,
    hostname: 'vector.maps.elastic.co',
    fieldInfo: fieldInfo,
    dataDir: 'test/fixtures/data',
  });
  t.same(vector, getExpectedVector(validDate), `${validDate} vector manifest`);

  t.throws(function(){
    generateVectorManifest(sources, {
      version: '1979-08-26',
      hostname: 'vector.maps.elastic.co',
      fieldInfo: fieldInfo,
      dataDir: 'test/fixtures/data',
    })
  },{},
  {skip: true})
  t.end();
});

tap('latest manifest', t => {
  const version = constants.LATEST_TAG;
  const dateVersion = coerceToDateSemver(version).date;

  // Try to generate a catalogue
  const catalogue = generateCatalogueManifest({
    version: version,
    tileHostname: 'tiles.maps.elstc.co',
    vectorHostname: 'vector.maps.elastic.co',
  });
  t.notOk(catalogue, `${version} catalogue should be falsy`);

  // Get a manifest
  const vector = generateVectorManifest(sources, {
    version: version,
    hostname: 'vector.maps.elastic.co',
    fieldInfo: fieldInfo,
    dataDir: 'test/fixtures/data',
  });
  t.same(vector, getExpectedVector(dateVersion), `${version} vector manifest`);

  t.end();
})


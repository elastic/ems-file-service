/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const fs = require('fs').promises;
const path = require('path');
const Mustache = require('mustache');
const Hjson = require('hjson');
const pMap = require('p-map');
const util = require('util');
const generateSource = require('./generate-source');
const getSophoxVectors = require('./generate-data');
const { stripWdUri } = require('./utils');
const geoipIsoCodes = require('../geoip-iso-codes');
const validateDataset = require('./validate-dataset');
const pino = require('pino');
const stringify = require('json-stringify-pretty-compact');

const mkdirp = util.promisify(require('mkdirp'));

const countries = require('../countries.json');
const geoip2csv = process.argv[2];

if (!geoip2csv) {
  throw new Error(`
    Please provide the path to the GeoLite2-City-Locations-en.csv file.
    Example:
    node scripts/generate-sources/index.js ~/Downloads/GeoLite2-City-Locations-en.csv
    The file can be downloaded from https://dev.maxmind.com/geoip/geoip2/geolite2/
  `);
}

// TODO This anonymous function actually doesn't return anything
(async () => {
  const isoCodes = await geoipIsoCodes(geoip2csv);
  const template = await fs.readFile('./templates/source_template.mustache', 'utf8');
  await mkdirp('./.scripted-regions/logs');
  await mkdirp('./.scripted-regions/data');
  await mkdirp('./.scripted-regions/sources');
  const logger = pino(pino.destination(path.join('./.scripted-regions/logs', `regions.log`)));
  const mapper = async country => {
    const countryCode = country.country_code.toLowerCase();
    const countryLogger = logger.child({ country_iso_code: country.country_code, country_name: country.name });
    const dir = await mkdirp(`./.scripted-regions/sources/${countryCode}`);
    if (!dir) {
      // If the country subdirectory already exists, assume the data has already been generated.
      // Don't overwrite any of the generated data.
      return noop();
    }
    const adminLevels = [1, 2];
    for (const adminLevel of adminLevels) {
      const subdivisionLogger = countryLogger.child({ admin_level: adminLevel });
      try {
        await sleep(1000);
        const source = await getSource({ id: stripWdUri(country.id), template: template, adminLevel: adminLevel });
        if (!source) {
          subdivisionLogger.warn('No data for administrative level');
          continue;
        }
        const sourceJson = Hjson.parse(source);
        const vectors = await getSophoxVectors({ sparql: sourceJson.query.sparql });
        if (!vectors.features) subdivisionLogger.warn('No vector features found');
        const subdivisions = isoCodes.get(countryCode.toUpperCase());
        const differences = await validateDataset({ vectors: vectors, isoCodes: subdivisions, adminLevel: adminLevel });
        differences.get('missing').forEach(code => subdivisionLogger.error({
          region_iso_code: code,
        }, `Vector is missing ISO Code`));
        differences.get('unmatched').forEach(code => subdivisionLogger.warn({
          region_iso_code: code,
        }, `ISO Code in vector does not exist in GeoIP2 database`));
        Promise.all([
          await fs.writeFile(path.join(dir, `${sourceJson.legacyIds[0]}.hjson`), source),
          await fs.writeFile(path.join('./.scripted-regions/data',
            sourceJson.emsFormats.filter(f => f.type === 'geojson')[0].file),
          stringify(vectors, { indent: 2 })),
        ]);
      } catch (err) {
        subdivisionLogger.error(err);
      }
    }
  };

  const result = await pMap(countries, mapper, { concurrency: 2 });
  console.log(result);
})();

// Random sleep between requests
function sleep(max) {
  max = Math.floor(max);
  const ms = Math.floor(Math.random() * (max - 100)) + 100;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function noop() {}

async function getSource({ id, template, adminLevel }) {
  const data = await generateSource(id, adminLevel);
  if (!data) return null;
  const source = Mustache.render(template, data);
  return source;
}

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const fs = require('fs');
const stream = require('stream');
const util = require('util');
const csv = require('csv-parser');
const unique = require('unique-stream');
const _ = require('lodash');
const countries = require('./countries.json');

const isoCodes = countries.map(country => country.country_code.toLowerCase());

const pipeline = util.promisify(stream.pipeline);

module.exports = geoLiteRegionCodes;

async function geoLiteRegionCodes(file, countryCodes = isoCodes) {
  if (typeof countryCodes === 'string') countryCodes = [countryCodes];
  const codes = new Map(countryCodes.map(code => {
    return [code.toUpperCase(), new Map([[1, new Set()], [2, new Set()]])];
  }));
  await pipeline(
    fs.createReadStream(file),
    csv(),
    isoCodesTransform(codes),
    unique()
      .on('data', d => {
        const obj = JSON.parse(d);
        const countryCodes = codes.get(obj.country_iso_code);
        countryCodes.forEach((v, k) => {
          const regionCode = obj[`subdivision_${k}_iso_code`];
          regionCode
            ? v.add(`${obj.country_iso_code}-${regionCode}`)
            : (() => {});
        });
      })
  );
  return codes;
}

function isoCodesTransform(countryIsoCodes) {
  const transformer = new stream.Transform({
    writableObjectMode: true,
    transform(chunk, enc, cb) {
      if (countryIsoCodes.has(chunk.country_iso_code)) {
        const data = _.pick(chunk, ['country_iso_code', 'subdivision_1_iso_code', 'subdivision_2_iso_code']);
        cb(null, JSON.stringify(data));
      } else {
        cb();
      }
    },
  });
  transformer.setEncoding('utf8');
  return transformer;
}

// Example:
// (async () => {
//   const results = await geoLiteRegionCodes('/Users/nickpeihl/Downloads/GeoLite2-City-CSV_20181218/GeoLite2-City-Locations-en.csv');
//   console.log(results);
// })();


/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import fs from 'node:fs';

import { parse as csvParse } from 'csv-parse/sync';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .usage('Script to extract regions overriding region and country data from a CSV')
  .version('0.1')
  .epilog('Elastic, 2020')
  .example('$0 duplicated-regions.csv in.geojson out.json')
  .help()
  .alias('h', 'help')
  .option('verbose', {
    alias: 'v',
    default: false,
    type: 'boolean',
    describe: 'Log about the process',
  })
  .demandCommand(3)
  .argv;

const [idsPath, inPath, outPath] = argv._;

function log(message) {
  if (argv.verbose) {
    console.log(message);
  }
}

if (!idsPath || !inPath || !outPath) {
  throw new Error(`Please provide all parameters`);
} else {
  log(`Processing ${inPath} to ${outPath} using ${idsPath}`);
}

// get the data objects
const ids = csvParse(fs.readFileSync(idsPath), {
  columns: true,
  skip_empty_lines: true,
});

const input = JSON.parse(fs.readFileSync(inPath));

const inputFeatures = input.features;
const outputFeatures = [];

for (const { in_region_iso, out_region_name, out_region_iso2, out_country_name, out_country_iso2, out_country_iso3 } of ids) {
  const regions = inputFeatures
    .filter(f => f.properties.iso_3166_2 === in_region_iso)
    .map(f => {
      return {
        'type': 'Feature',
        'geometry': f.geometry,
        'properties': {
          name: out_region_name,
          iso_3166_2: out_region_iso2,
          iso_a2: out_country_iso2,
          adm0_a3: out_country_iso3,
          admin: out_country_name,
        },
      };
    });
  outputFeatures.push(...regions);
}

log(`Output dataset with ${outputFeatures.length} fatures`);

const output = { 'type': 'FeatureCollection', 'features': outputFeatures };

fs.writeFileSync(outPath, JSON.stringify(output));

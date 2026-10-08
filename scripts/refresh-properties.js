/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// Re-run the SPARQL query of a source file on Sophox and update the feature
// properties of its GeoJSON data file. Geometries are never modified.
//
// Features are matched by their Wikidata id (feature `id`). Use --id-map
// when Wikidata moved an entity to a new item (e.g. --id-map Q5765=Q107356467).
//
// Usage:
//   node scripts/refresh-properties.js [--id-map OLD=NEW ...] [--dry-run] <source.hjson> <data.geo.json>

import fs from 'node:fs';
import { URLSearchParams } from 'node:url';
import fetch from 'node-fetch';
import hjson from 'hjson';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const SOPHOX_SPARQL = 'https://sophox.org/sparql';

const argv = yargs(hideBin(process.argv))
  .usage('$0 [options] <source> <data>')
  .option('id-map', {
    type: 'string',
    describe: 'OLD=NEW Wikidata id replacement for a feature in the data file (repeatable)',
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Report changes without writing the data file',
  })
  .demandCommand(2)
  .help()
  .parse();

const [sourcePath, dataPath] = argv._;

const idMap = Object.fromEntries([argv['id-map'] ?? []].flat().map(pair => {
  const [from, to] = String(pair).split('=');
  if (!from || !to) throw new Error(`Invalid --id-map value: ${pair}`);
  return [from, to];
}));

async function runQuery(sparql) {
  const res = await fetch(SOPHOX_SPARQL, {
    method: 'POST',
    headers: {
      'Accept': 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ems-file-service (https://github.com/elastic/ems-file-service)',
    },
    body: new URLSearchParams({ query: sparql }),
  });
  if (!res.ok) throw new Error(`Sophox returned ${res.status}: ${await res.text()}`);
  const { head, results } = await res.json();
  const fields = head.vars.filter(v => v !== 'id');
  const rows = new Map();
  for (const binding of results.bindings) {
    const id = binding.id.value.replace('http://www.wikidata.org/entity/', '');
    if (rows.has(id)) throw new Error(`Duplicate id in query results: ${id}`);
    rows.set(id, Object.fromEntries(fields
      .filter(f => binding[f])
      .map(f => [f, binding[f].value])));
  }
  return rows;
}

async function main() {
  const source = hjson.parse(fs.readFileSync(sourcePath, 'utf8'));
  const sparql = source.query?.sparql;
  if (!sparql) throw new Error(`No query.sparql in ${sourcePath}`);

  const geojson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rows = await runQuery(sparql);

  const errors = [];
  const changes = [];
  const matched = new Set();

  for (const feature of geojson.features) {
    const id = idMap[feature.id] ?? feature.id;
    const row = rows.get(id);
    if (!row) {
      errors.push(`Feature ${feature.id} not found in query results`);
      continue;
    }
    matched.add(id);
    if (feature.id !== id) {
      changes.push(`${feature.id}: id -> ${id}`);
      feature.id = id;
    }
    for (const [key, value] of Object.entries(row)) {
      if (feature.properties[key] !== value) {
        changes.push(`${id}: ${key} ${JSON.stringify(feature.properties[key])} -> ${JSON.stringify(value)}`);
        feature.properties[key] = value;
      }
    }
  }

  for (const id of rows.keys()) {
    if (!matched.has(id)) errors.push(`Query result ${id} has no feature in ${dataPath}`);
  }

  changes.forEach(c => console.error(c));
  if (errors.length) throw new Error(errors.join('\n'));
  if (!changes.length) console.error('No changes');

  if (!argv['dry-run'] && changes.length) {
    fs.writeFileSync(dataPath, JSON.stringify(geojson));
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});

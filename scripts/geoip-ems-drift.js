#!/usr/bin/env node
/*
 * Offline GeoIP vs EMS administrative regions drift check.
 *
 * Derives the exact set of ISO 3166-2 codes that the Elasticsearch geoip
 * ingest processor can emit as `geo.region_iso_code`, using MaxMind's
 * getMostSpecificSubdivision() rule:
 *   use subdivision_2_iso_code if present, else subdivision_1_iso_code
 *
 * Diffs that set against one or more EMS admin_regions_lvl2 GeoJSON files.
 * No running Elasticsearch required.
 *
 * Usage:
 *   node scripts/geoip-ems-drift.js [options]
 *
 * Options:
 *   --locations <path>   GeoLite2-City-Locations-en.csv  (default: /tmp/geoip/GeoLite2-City-Locations-en.csv)
 *   --ems <paths...>     EMS GeoJSON files to compare    (default: data/admin_regions_lvl2_v2.geo.json)
 *   --country <cc>       Filter to a single country code
 *   --json               Output raw JSON instead of table
 *   --fail-on-drift      Exit 1 if any country has GeoIP-only codes (for CI)
 */

import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- arg parsing ---
const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};
const getAll = (flag, def) => {
  const vals = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1]) vals.push(args[++i]);
  }
  return vals.length ? vals : def;
};
const has = flag => args.includes(flag);

const LOCATIONS_CSV = get('--locations', '/tmp/geoip/GeoLite2-City-Locations-en.csv');
const EMS_FILES = getAll('--ems', [resolve(ROOT, 'data/admin_regions_lvl2_v2.geo.json')]);
const FILTER_CC = get('--country', null);
const JSON_OUT = has('--json');
const FAIL_ON_DRIFT = has('--fail-on-drift');

// --- read GeoIP most-specific codes ---
async function readGeoIPCodes(csvPath) {
  const codes = new Map(); // cc -> Set<fullCode>
  const names = new Map(); // fullCode -> name

  const rl = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity });
  let header = null;

  for await (const line of rl) {
    if (!header) {
      header = line.split(',');
      continue;
    }
    const row = parseCSVLine(line, header);
    const cc = row.country_iso_code?.trim();
    if (!cc) continue;
    if (FILTER_CC && cc !== FILTER_CC) continue;

    const s1 = row.subdivision_1_iso_code?.trim();
    const s2 = row.subdivision_2_iso_code?.trim();
    const most = s2 || s1;
    if (!most) continue;

    const full = `${cc}-${most}`;
    const name = s2 ? row.subdivision_2_name?.trim() : row.subdivision_1_name?.trim();

    if (!codes.has(cc)) codes.set(cc, new Set());
    codes.get(cc).add(full);
    if (!names.has(full)) names.set(full, name || '');
  }

  return { codes, names };
}

function parseCSVLine(line, header) {
  const vals = line.split(',');
  const row = {};
  header.forEach((h, i) => { row[h] = vals[i] ?? ''; });
  return row;
}

// --- read EMS codes ---
async function readEMSCodes(geojsonPath) {
  const raw = JSON.parse(await readFile(geojsonPath, 'utf8'));
  const codes = new Map(); // cc -> Set<code>
  for (const feat of raw.features) {
    const cc = feat.properties.country_iso2_code;
    const code = feat.properties.region_iso_code?.replace(/~$/, '');
    if (!cc || !code) continue;
    if (FILTER_CC && cc !== FILTER_CC) continue;
    if (!codes.has(cc)) codes.set(cc, new Set());
    codes.get(cc).add(code);
  }
  return codes;
}

// --- main ---
const { codes: geoipCodes, names } = await readGeoIPCodes(LOCATIONS_CSV);

const emsSets = [];
for (const f of EMS_FILES) {
  const label = f.replace(/.*\//, '');
  emsSets.push({ label, codes: await readEMSCodes(f) });
}

const allCountries = [...geoipCodes.keys()].sort();

const results = allCountries.map(cc => {
  const geoip = geoipCodes.get(cc);
  const row = { cc, geoip: geoip.size, datasets: [] };

  for (const { label, codes } of emsSets) {
    const ems = codes.get(cc) ?? new Set();
    const match = [...geoip].filter(c => ems.has(c));
    const geoipOnly = [...geoip].filter(c => !ems.has(c));
    const emsOnly = [...ems].filter(c => !geoip.has(c));
    const pct = Math.round(100 * match.length / geoip.size);
    row.datasets.push({ label, ems: ems.size, match: match.length, geoipOnly, emsOnly, pct });
  }
  return row;
});

if (JSON_OUT) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

// --- table output ---
const pad = (s, n, r = false) => r ? String(s).padStart(n) : String(s).padEnd(n);

// header
const datasetCols = emsSets.map(e => e.label.replace('admin_regions_lvl2_', '').replace('.geo.json', ''));
const colW = 10;
let header = `${pad('cc', 4)} ${pad('geoip', 6)}`;
for (const d of datasetCols) header += `  ${pad(d, colW)} ${pad('match%', 7)} ${pad('miss', 5)} ${pad('extra', 6)}`;
console.log(header);
console.log('-'.repeat(header.length));

let anyDrift = false;
for (const r of results) {
  let line = `${pad(r.cc, 4)} ${pad(r.geoip, 6, true)}`;
  let rowDrift = false;
  for (const d of r.datasets) {
    const flag = d.geoipOnly.length > 0 ? (d.pct < 50 ? ' !!!' : ' !') : '';
    if (d.geoipOnly.length > 0) { rowDrift = true; anyDrift = true; }
    line += `  ${pad(d.ems, colW, true)} ${pad(d.pct + '%', 7, true)} ${pad(d.geoipOnly.length, 5, true)} ${pad(d.emsOnly.length, 6, true)}${flag}`;
  }
  console.log(line);

  // detail lines for drifting countries (when not too many)
  if (rowDrift && r.datasets[0]?.geoipOnly.length <= 10) {
    for (const d of r.datasets) {
      if (d.geoipOnly.length) {
        const codes = d.geoipOnly.map(c => `${c}(${names.get(c) || '?'})`).join(', ');
        console.log(`     GeoIP-only in ${d.label}: ${codes}`);
      }
    }
  }
}

// summary
console.log('-'.repeat(header.length));
console.log(`\nTotal countries: ${results.length}`);
for (let i = 0; i < emsSets.length; i++) {
  const d = emsSets[i];
  const rows = results.map(r => r.datasets[i]);
  const pct100 = rows.filter(r => r.pct === 100).length;
  const pctLt50 = rows.filter(r => r.pct < 50).length;
  const pct0 = rows.filter(r => r.pct === 0).length;
  console.log(`${d.label}: 100%=${pct100}  <50%=${pctLt50}  0%=${pct0}`);
}

if (FAIL_ON_DRIFT && anyDrift) {
  process.exit(1);
}

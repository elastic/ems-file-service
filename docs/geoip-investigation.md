# GeoIP Investigation Guide

When adding or updating an EMS layer, verify that the ISO codes in the layer match what the GeoIP ingest pipeline emits for `geo.region_iso_code`. This guide documents the workflow.

## Getting the database

Use the helper script to download the latest GeoLite2-City CSV and mmdb from Elastic's hosted mirror. No MaxMind account is required.

```bash
./scripts/get-geoip-db.sh [output-dir]
# Default output-dir: /tmp/geoip
# Produces:
#   /tmp/geoip/GeoLite2-City-Locations-en.csv  (for drift check)
#   /tmp/geoip/GeoLite2-City.mmdb              (for demo seed)
```

The signed URL expires after 24 hours, so re-run if the download fails.

## Extracting subdivision codes for a country

```bash
python3 -c "
import csv
codes = {}
with open('/tmp/geoip/GeoLite2-City-Locations-en.csv') as f:
    for row in csv.DictReader(f):
        if row['country_iso_code'] != 'FR': continue
        s2 = row['subdivision_2_iso_code'].strip()
        s1 = row['subdivision_1_iso_code'].strip()
        most = s2 or s1          # getMostSpecificSubdivision rule
        if most:
            code = 'FR-' + most
            codes[code] = row['subdivision_2_name'] or row['subdivision_1_name']
for code in sorted(codes):
    print(f'{code}: {codes[code]}')
print(f'Total: {len(codes)}')
"
```

Replace `FR` with the target country ISO2 code. The script applies the same `getMostSpecificSubdivision()` rule that the Elasticsearch `geoip` processor uses: `subdivision_2_iso_code` if present, otherwise `subdivision_1_iso_code`.

For an automated drift check across all countries, use `scripts/geoip-ems-drift.js`.

## Comparing against Wikidata

Query Wikidata for the country's first-level administrative divisions:

```sparql
SELECT ?id ?iso ?label_en WHERE {
  VALUES ?entity { wd:Q142 }          # replace Q142 with the target country
  ?entity wdt:P150 ?id .
  ?id wdt:P300 ?iso .
  OPTIONAL { ?id rdfs:label ?label_en . FILTER(LANG(?label_en) = "en") }
}
ORDER BY ?iso
```

Run at <https://query.wikidata.org/>. The `P31` (instance of) type on the results tells you which Wikidata entity type covers the admin level GeoIP uses.

## What to watch for

**Code mismatches.** GeoIP uses GeoNames admin codes mapped to ISO 3166-2. These sometimes diverge from the "official" ISO code:
- France Corsica: GeoIP emits `FR-20R`, not the ISO standard `FR-COR`.
- Norway: GeoIP uses a hybrid of pre-2020 and 2020 codes after the county merges were partially reversed. See `sources/no/GEOIP_INVESTIGATION.md`.

**Admin level.** The Elasticsearch `geoip` processor uses `getMostSpecificSubdivision()` — the deepest subdivision available in the database for each IP, not necessarily the top-level region. For France, this means department-level codes (`FR-91`, `FR-63`) are emitted in ~99% of cases; region codes (`FR-IDF`) only appear for IPs where MaxMind has no department-level data. EMS layers must match the level GeoIP actually emits to be joinable. For countries where MaxMind has uneven depth coverage, GeoIP can emit a mix of two levels (e.g. Spain: province for most IPs, autonomous community as fallback).

**Overseas territories.** Some territories appear under their own country code in GeoIP rather than under the parent country. French overseas departments (Guadeloupe, Martinique, etc.) appear as `country_iso_code=GP/MQ/…` with no subdivision code, not as `FR-971`/`FR-972`/…

**Wikidata type.** When filtering the SPARQL query by instance type (`wdt:P31`), confirm which Wikidata entity the admin divisions actually use. For France regions it is `Q36784`, not `Q22781`. Run the query without a type filter first to inspect `?type`.

## Systematic drift audit (2026-07-28)

Related: https://github.com/elastic/ems-file-service/issues/689

A full comparison of all GeoIP emitted codes (applying `getMostSpecificSubdivision()`) against
`administrative_regions_lvl2_v2` was run against the 2026-07-25 GeoLite2-City database.
207 countries have GeoIP subdivisions; 17 have less than 50% code overlap with EMS, 13 have 0%.

Use `scripts/geoip-ems-drift.js` to reproduce or update this audit.

### Countries with significant drift

#### Code standard mismatch — same level, different ISO revision

| Country | GeoIP format | EMS format | Example | Fix |
|---------|-------------|------------|---------|-----|
| GT | numeric | alpha | GT-01 vs GT-AV | Update `region_iso_code` values (data only, no geometry) |
| KZ | numeric | alpha | KZ-10 vs KZ-AKM | Update `region_iso_code` values (data only, no geometry) |
| MK | 3-digit numeric | 2-digit numeric | MK-101 vs MK-01 | Different admin level — requires geometry rebuild |

#### New administrative units not yet in EMS

Countries where GeoIP has codes for recently created regions:
DZ (+5), ID (+3), IN (+5), GH (+5), ET (+1), FR (+13 departments), GB (+3), LV (+3), LT (+4), others.

#### X-code mismatch — EMS uses unofficial codes, GeoIP uses letter codes

AS, NC, MP, VI, PM, PF, TK. Small territories without full ISO 3166-2 coverage.

#### Country code mismatch

BQ (Caribbean Netherlands): GeoIP emits `BQ-BO/SA/SE`; EMS stores under `NL-BQ1/2/3`.

### Mixed admin level (Spain / Italy pattern)

For countries where MaxMind has uneven subdivision depth, GeoIP emits a mix of two levels
within the same country. Spain example: most IPs → province (`ES-M`, `ES-V`); IPs with lower
MaxMind precision → autonomous community (`ES-MD`, `ES-VC`). No single EMS layer can join both
cleanly. This is a MaxMind data quality issue, not fixable in EMS alone.

---

This audit is the basis for a broader work item to align `administrative_regions_lvl2` with
GeoIP subdivision codes. A CI check using `scripts/geoip-ems-drift.js` comparing GeoIP codes
against EMS on each database update would catch future drift.

## Documenting findings

Create a `GEOIP_INVESTIGATION.md` in the relevant `sources/<cc>/` directory. See `sources/no/GEOIP_INVESTIGATION.md` and `sources/fr/GEOIP_INVESTIGATION.md` for examples. Include:

- Method (how the database was obtained)
- Database date
- Full table of GeoIP codes found
- Any discrepancies vs ISO standard or Wikidata
- Required EMS changes

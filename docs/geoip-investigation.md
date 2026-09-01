# GeoIP Investigation Guide

When adding or updating an EMS layer, verify that the ISO codes in the layer match what the GeoIP ingest pipeline emits for `geo.region_iso_code`. This guide documents the workflow.

## Getting the database

Use the helper script to download the latest GeoLite2-City CSV from Elastic's hosted mirror. No MaxMind account is required.

```bash
./scripts/get-geoip-db.sh [output-dir]
# Default output-dir: /tmp/geoip
# Produces: /tmp/geoip/GeoLite2-City-CSV.zip
```

The signed URL expires after 24 hours, so re-run if the download fails.

## Extracting subdivision codes for a country

```bash
unzip -p /tmp/geoip/GeoLite2-City-CSV.zip GeoLite2-City-Locations-en.csv \
  | python3 -c "
import csv, sys
reader = csv.DictReader(sys.stdin)
regions = {}
for row in reader:
    if row['country_iso_code'] == 'FR' and row['subdivision_1_iso_code']:
        code = 'FR-' + row['subdivision_1_iso_code']
        regions[code] = row['subdivision_1_name']
for code in sorted(regions):
    print(f'{code}: {regions[code]}')
print(f'\nTotal: {len(regions)}')
"
```

Replace `FR` with the target country ISO2 code. The `subdivision_1_iso_code` column contains the bare subdivision code without the country prefix (e.g. `IDF` not `FR-IDF`).

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

**Wrong admin level.** GeoIP always operates at the admin1 level (the `subdivision_1_iso_code` column). EMS layers must match that level to be joinable. France historically had department-level codes in EMS while GeoIP used region-level — they never matched.

**Overseas territories.** Some territories appear under their own country code in GeoIP rather than under the parent country. French overseas departments (Guadeloupe, Martinique, etc.) appear as `country_iso_code=GP/MQ/…` with no subdivision code, not as `FR-971`/`FR-972`/…

**Wikidata type.** When filtering the SPARQL query by instance type (`wdt:P31`), confirm which Wikidata entity the admin divisions actually use. For France regions it is `Q36784`, not `Q22781`. Run the query without a type filter first to inspect `?type`.

## Documenting findings

Create a `GEOIP_INVESTIGATION.md` in the relevant `sources/<cc>/` directory. See `sources/no/GEOIP_INVESTIGATION.md` and `sources/fr/GEOIP_INVESTIGATION.md` for examples. Include:

- Method (how the database was obtained)
- Database date
- Full table of GeoIP codes found
- Any discrepancies vs ISO standard or Wikidata
- Required EMS changes

# France Regions: GeoIP Subdivision Code Investigation

Related: https://github.com/elastic/ems-file-service/issues/689

## Summary

GeoIP (MaxMind GeoLite2-City, via Elastic's GeoIP service) uses region-level ISO 3166-2 codes
for France at `geo.region_iso_code`. EMS has only department-level codes in the
`administrative_regions_lvl2` dataset, causing a mismatch when joining GeoIP-enriched data to
EMS maps. The mismatch has existed since the dataset was created in July 2020 — GeoIP has
always used region-level codes for France since the 2016 territorial reform.

## Method

Downloaded `GeoLite2-City-CSV.zip` from Elastic's GeoIP service endpoint using
`scripts/get-geoip-db.sh`. Extracted unique `subdivision_1_iso_code` values where
`country_iso_code = FR`. See `docs/geoip-investigation.md` for the general workflow.

Database date: 2026-07-21.

## Results: 13 unique region codes

| GeoIP code | Region name (GeoIP) | Official French name |
|------------|--------------------|--------------------|
| `FR-20R` | Corsica | Corse |
| `FR-ARA` | Rhône-Alpes | Auvergne-Rhône-Alpes |
| `FR-BFC` | Bourgogne | Bourgogne-Franche-Comté |
| `FR-BRE` | Brittany | Bretagne |
| `FR-CVL` | Centre-Val de Loire | Centre-Val de Loire |
| `FR-GES` | Grand Est | Grand Est |
| `FR-HDF` | Hauts-de-France | Hauts-de-France |
| `FR-IDF` | Île-de-France | Île-de-France |
| `FR-NAQ` | New Aquitaine | Nouvelle-Aquitaine |
| `FR-NOR` | Normandy | Normandie |
| `FR-OCC` | Occitanie | Occitanie |
| `FR-PAC` | Provence-Alpes-Côte d'Azur | Provence-Alpes-Côte d'Azur |
| `FR-PDL` | Pays de la Loire | Pays de la Loire |

All 13 codes correspond to Wikidata entities of type `Q36784` (region of France),
reachable via `wd:Q142 wdt:P150 ?id` (one hop from France).

## Key findings

### Corsica: FR-20R not FR-COR

GeoIP emits `FR-20R` for Corsica — the GeoNames admin code — not the formal ISO 3166-2 code
`FR-COR`. Wikidata's P300 property also stores `FR-20R` for the Collectivité de Corse, so no
remapping is needed in queries or data.

### Overseas departments not under FR

The five French overseas departments (Guadeloupe, Martinique, French Guiana, Réunion, Mayotte)
appear in GeoIP under their own country codes (GP, MQ, GF, RE, YT) without any
`subdivision_1_iso_code`. They are not present as `FR-971`…`FR-976` in the GeoIP database.

The `administrative_regions_lvl2` dataset currently contains both `FR-GF`/`FR-GP`/`FR-MQ`/
`FR-RE`/`FR-YT` (country=FR) and `GF-GF`/`GP-GP`/`MQ-MQ`/`RE-RE`/`YT-YT` (own country codes),
resulting in duplicate overlapping polygons for all five territories.

### Wikidata type

The correct Wikidata type for French administrative regions is `Q36784` (region of France).
The query `wdt:P31/wdt:P279* wd:Q22781` returns no results for French regions.

### Paris missing from Wikidata dept→region mapping

When querying the department-to-region mapping via Wikidata, Paris (FR-75) does not appear
because Wikidata types it differently from other departments. It must be assigned manually
to FR-IDF in any dissolve operation.

Verified dept→region mapping from Wikidata (FR-75 added manually):

| Region | Departments |
|--------|------------|
| FR-ARA | FR-01 FR-03 FR-07 FR-15 FR-26 FR-38 FR-42 FR-43 FR-63 FR-69 FR-73 FR-74 |
| FR-BFC | FR-21 FR-25 FR-39 FR-58 FR-70 FR-71 FR-89 FR-90 |
| FR-BRE | FR-22 FR-29 FR-35 FR-56 |
| FR-CVL | FR-18 FR-28 FR-36 FR-37 FR-41 FR-45 |
| FR-GES | FR-08 FR-10 FR-51 FR-52 FR-54 FR-55 FR-57 FR-67 FR-68 FR-88 |
| FR-HDF | FR-02 FR-59 FR-60 FR-62 FR-80 |
| FR-IDF | FR-75 FR-77 FR-78 FR-91 FR-92 FR-93 FR-94 FR-95 |
| FR-NAQ | FR-16 FR-17 FR-19 FR-23 FR-24 FR-33 FR-40 FR-47 FR-64 FR-79 FR-86 FR-87 |
| FR-NOR | FR-14 FR-27 FR-50 FR-61 FR-76 |
| FR-OCC | FR-09 FR-11 FR-12 FR-30 FR-31 FR-32 FR-34 FR-46 FR-48 FR-65 FR-66 FR-81 FR-82 |
| FR-PAC | FR-04 FR-05 FR-06 FR-13 FR-83 FR-84 |
| FR-PDL | FR-44 FR-49 FR-53 FR-72 FR-85 |
| FR-20R | FR-2A FR-2B |

## Required EMS changes

Replace the 101 France department features in `administrative_regions_lvl2` with the 13
metropolitan region features above. Drop `FR-GF`/`FR-GP`/`FR-MQ`/`FR-RE`/`FR-YT` — their
own-country-code duplicates (`GF-GF` etc.) remain and GeoIP does not use FR-* for them.

This requires a new version (v3) of the `administrative_regions_lvl2` dataset. The v2 dataset
remains available for older EMS versions. The geometry for the 13 regions can be derived by
dissolving the existing department polygons in v2 using the mapping table above.

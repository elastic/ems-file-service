# Norway Counties

Related issue: https://github.com/elastic/ems-file-service/issues/565

## Dataset versions

### v1 (`norway_counties_v1.geo.json`)

Original dataset with 20 features using pre-2020 ISO 3166-2 codes (NO-01 through NO-20, plus NO-50 Troendelag). Served to Kibana/Elasticsearch versions 1 through 7.

### v2 (`norway_counties_v2.geo.json`)

Updated dataset with 23 features, served to Kibana/Elasticsearch versions 8+. Contains all 20 original pre-2020 features plus 3 new features created by dissolving county pairs that were merged in the 2020 Norwegian administrative reform:

| New code | New name | Merged from |
|----------|----------|-------------|
| NO-34 | Innlandet | NO-04 (Hedmark) + NO-05 (Oppland) |
| NO-42 | Agder | NO-09 (Aust-Agder) + NO-10 (Vest-Agder) |
| NO-46 | Vestland | NO-12 (Hordaland) + NO-14 (Sogn og Fjordane) |

The original features are kept alongside the merged ones so that users with any version of the MaxMind GeoIP database (pre-2020 or post-March 2024) can find matching geometries. This means there are intentionally overlapping geometries in the dataset.

## Background

In March 2024, MaxMind updated their GeoLite2-City database to reflect Norway's 2024 county splits. However, rather than using the new 2024 ISO codes (NO-31, NO-32, etc.), they reverted to the pre-2020 codes for the split counties while keeping the 2020 codes for counties that stayed merged. See [`GEOIP_INVESTIGATION.md`](GEOIP_INVESTIGATION.md) for the full analysis.

## Building v2

Run `make` in this directory. Requires [`mapshaper`](https://github.com/mbloch/mapshaper) on PATH.

The Makefile takes v1 as input and:

1. Filters and dissolves each pair of pre-2020 counties into a single merged feature with the 2020 ISO code and labels
2. Combines all original v1 features with the 3 new merged features
3. Sorts by ISO code and runs `clean-geom.js` to fix any geometry issues

To rebuild from scratch:

```
make clean && make
```

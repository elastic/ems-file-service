# Norway Counties: GeoIP Subdivision Code Investigation

Related: https://github.com/elastic/ems-file-service/issues/565

## Summary

MaxMind's GeoLite2-City database uses a **hybrid of pre-2020 and 2020 ISO 3166-2 codes** for Norway.
It does **not** use the 2024 codes from Wikidata, nor the 2020 codes for counties that were split back.

## MaxMind Release Notes (March 2024)

From the [March 2024 GeoNames diff report](https://dev.maxmind.com/geoip/release-notes/2024/#geonames-monthly-diff-report-march-2024):

> In 2020, Norway merged a number of their subdivisions, but this proved unpopular and they have now
> unmerged these subdivisions. We have used the ISO subdivision codes for these subdivisions from
> before the 2020 change.

The diff CSV confirms the transitions:

```
curl -sL "https://dev.maxmind.com/csv/GeoNames-Monthly-Diff-Report-March-2024.csv" | grep ",NO," \
  | awk -F',' '{print $10 " -> " $11}' | sort | uniq -c | sort -rn
```

```
    131 30 -> 2    # Viken → Akershus
     54 54 -> 19   # Troms og Finnmark → Troms
     50 30 -> 6    # Viken → Buskerud
     45 30 -> 1    # Viken → Østfold
     44 38 -> 7    # Vestfold og Telemark → Vestfold
     33 38 -> 8    # Vestfold og Telemark → Telemark
     28 54 -> 20   # Troms og Finnmark → Finnmark
```

Counties that stayed merged (NO-34, NO-42, NO-46, NO-50) are absent from the diff — they kept their 2020 codes.
No changes in the [2025](https://dev.maxmind.com/geoip/release-notes/2025/) or [2026](https://dev.maxmind.com/geoip/release-notes/2026/) release notes.

## Elasticsearch GeoIP Validation

Scanned 2,560 Norwegian IPs via the Elasticsearch GeoIP ingest processor (`_simulate` API) using
GeoLite2-City.mmdb (downloaded via Elastic's GeoIP downloader on ES 9.3.0).

### Setup

```bash
# Enable eager download to fetch GeoLite2-City.mmdb
curl -s -u "$AUTH" -X PUT "$ES/_cluster/settings" \
  -H 'Content-Type: application/json' -d '{
  "transient": { "ingest.geoip.downloader.eager.download": true }
}'

# Create test pipeline
curl -s -u "$AUTH" -X PUT "$ES/_ingest/pipeline/norway-geoip-test" \
  -H 'Content-Type: application/json' -d '{
  "processors": [{
    "geoip": {
      "field": "ip",
      "properties": ["country_iso_code", "region_iso_code", "region_name", "city_name"]
    }
  }]
}'
```

### Scan

IPs sampled across: Telenor (77.16.0.0/13, 84.208.0.0/12), Altibox (80.91.0.0/16),
NextGenTel (85.164.0.0/15), Telia (88.89-95.0.0), UNINETT (128.39, 129.241, 152.94, 158.36.0.0/14),
and various 193.x/195.x ranges. Processed in batches of 100 via `_simulate`.

```python
# Core loop (abbreviated)
for batch in batched(ips, 100):
    docs = [{"_source": {"ip": ip}} for ip in batch]
    result = curl POST "/_ingest/pipeline/norway-geoip-test/_simulate" {"docs": docs}
    for doc in result["docs"]:
        geoip = doc["doc"]["_source"].get("geoip", {})
        # collect unique region_iso_code values where country_iso_code == "NO"
```

### Results: 15 unique region codes

| Code | Name | Type | Example cities |
|------|------|------|----------------|
| `NO-01` | Østfold | Pre-2020 (split back) | Fredrikstad, Sarpsborg, Halden, Moss |
| `NO-02` | Akershus | Pre-2020 (split back) | Lillestrøm, Skjetten, Asker |
| `NO-03` | Oslo | Unchanged | Oslo |
| `NO-06` | Buskerud | Pre-2020 (split back) | Drammen, Kongsberg, Hokksund |
| `NO-07` | Vestfold | Pre-2020 (split back) | Sandefjord, Tønsberg, Horten |
| `NO-08` | Telemark | Pre-2020 (split back) | Skien, Porsgrunn, Seljord |
| `NO-11` | Rogaland | Unchanged | Stavanger, Haugesund, Sandnes |
| `NO-15` | Møre og Romsdal | Unchanged | Molde, Ålesund |
| `NO-18` | Nordland | Unchanged | Bodø, Narvik, Leknes |
| `NO-19` | Troms | Pre-2020 (split back) | Tromsø |
| `NO-20` | Finnmark | Pre-2020 (split back) | Veines |
| `NO-34` | Innlandet | 2020 (stayed merged) | Hamar, Kongsvinger, Løten |
| `NO-42` | Agder | 2020 (stayed merged) | Kristiansand, Mandal, Grimstad |
| `NO-46` | Vestland | 2020 (stayed merged) | Bergen, Paradis, Manger |
| `NO-50` | Trøndelag | 2020 (stayed merged) | Trondheim, Orkanger, Rørvik |

Codes **not** present: NO-04, NO-05, NO-09, NO-10, NO-12, NO-14 (pre-2020 for merged counties),
NO-30, NO-38, NO-54 (2020 split-back), NO-31–33, NO-39–40, NO-55–56 (2024 Wikidata).

## Required EMS Changes

| Current EMS code | GeoIP status | Action |
|---|---|---|
| NO-04 Hedmark + NO-05 Oppland | ❌ Gone | Merge geometry → **NO-34 Innlandet** |
| NO-09 Aust-Agder + NO-10 Vest-Agder | ❌ Gone | Merge geometry → **NO-42 Agder** |
| NO-12 Hordaland + NO-14 Sogn og Fjordane | ❌ Gone | Merge geometry → **NO-46 Vestland** |
| All other codes (01–03, 06–08, 11, 15, 18–20, 50) | ✅ Match | Keep as-is |

Six pre-2020 codes → four 2020 merged codes. Feature count: 19 → 16 (+ Svalbard, Jan Mayen = 18 total).

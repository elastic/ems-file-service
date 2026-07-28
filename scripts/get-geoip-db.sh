#!/usr/bin/env bash
# Downloads the latest GeoLite2-City CSV and mmdb from Elastic's GeoIP service endpoint.
# No MaxMind account needed — uses Elastic's hosted mirror.
#
# Usage: ./scripts/get-geoip-db.sh [output-dir]
# Default output-dir: /tmp/geoip
#
# Output:
#   <output-dir>/GeoLite2-City-Locations-en.csv   (for drift check / seed derivation)
#   <output-dir>/GeoLite2-City-Blocks-IPv4.csv    (for seed IP lookup)
#   <output-dir>/GeoLite2-City.mmdb               (for pushing to ES cluster)
set -euo pipefail

OUTPUT_DIR="${1:-/tmp/geoip}"
mkdir -p "$OUTPUT_DIR"
ZIP="$OUTPUT_DIR/GeoLite2-City-CSV.zip"
TGZ="$OUTPUT_DIR/GeoLite2-City.tgz"

echo "Fetching database list..."
read -r CSV_URL MMDB_URL UPDATED < <(curl -s "https://geoip.elastic.co/v1/database?elastic_geoip_service_tos=agree" \
  | python3 -c "
import json, sys, datetime
dbs = json.load(sys.stdin)
by_name = {d['name']: d for d in dbs}
csv_entry  = by_name['GeoLite2-City-CSV.zip']
mmdb_entry = by_name['GeoLite2-City.tgz']
date = datetime.datetime.fromtimestamp(csv_entry['updated']).strftime('%Y-%m-%d')
print(csv_entry['url'], mmdb_entry['url'], date)
")

echo "Downloading GeoLite2-City-CSV.zip (database date: $UPDATED)..."
curl -s -o "$ZIP" "$CSV_URL"
echo "Saved: $ZIP ($(du -h "$ZIP" | cut -f1))"

echo "Downloading GeoLite2-City.tgz (mmdb, same build)..."
curl -s -o "$TGZ" "$MMDB_URL"
echo "Saved: $TGZ ($(du -h "$TGZ" | cut -f1))"

echo "Extracting CSV files..."
unzip -o -q "$ZIP" -d "$OUTPUT_DIR"

echo "Extracting mmdb..."
tar -xzf "$TGZ" -C "$OUTPUT_DIR" "GeoLite2-City.mmdb"

echo ""
echo "Ready."
echo "  CSV:  $OUTPUT_DIR/GeoLite2-City-Locations-en.csv"
echo "  mmdb: $OUTPUT_DIR/GeoLite2-City.mmdb"

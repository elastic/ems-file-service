#!/usr/bin/env bash
# Downloads the latest GeoLite2-City-CSV from Elastic's GeoIP service endpoint.
# No MaxMind account needed — uses Elastic's hosted mirror.
#
# Usage: ./scripts/get-geoip-db.sh [output-dir]
# Default output-dir: /tmp/geoip
set -euo pipefail

OUTPUT_DIR="${1:-/tmp/geoip}"
mkdir -p "$OUTPUT_DIR"
ZIP="$OUTPUT_DIR/GeoLite2-City-CSV.zip"

echo "Fetching database list..."
CSV_URL=$(curl --silent --show-error --fail "https://geoip.elastic.co/v1/database?elastic_geoip_service_tos=agree" \
  | python3 -c "
import json, sys
dbs = json.load(sys.stdin)
print(next(d['url'] for d in dbs if d['name'] == 'GeoLite2-City-CSV.zip'))
")

echo "Downloading GeoLite2-City-CSV.zip..."
curl -s -o "$ZIP" "$CSV_URL"
echo "Saved: $ZIP ($(du -h "$ZIP" | cut -f1))"

# Print database date from the updated timestamp in the listing
UPDATED=$(curl --silent --show-error --fail "https://geoip.elastic.co/v1/database?elastic_geoip_service_tos=agree" \
  | python3 -c "
import json, sys, datetime
dbs = json.load(sys.stdin)
ts = next(d['updated'] for d in dbs if d['name'] == 'GeoLite2-City-CSV.zip')
print(datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d'))
")
echo "Database date: $UPDATED"

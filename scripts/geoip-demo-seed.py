#!/usr/bin/env -S uv run
# /// script
# dependencies = ["maxminddb"]
# ///
#
# Builds a bulk NDJSON seed file for the demo-geoip index.
# Reads the mmdb directly — guarantees seed IPs match ES enrichment exactly.
# One document per distinct most-specific subdivision code (getMostSpecificSubdivision rule).
#
# Usage:
#   uv run scripts/geoip-demo-seed.py [options] > /tmp/geoip-seed.ndjson
#
# Options:
#   --mmdb <path>     GeoLite2-City.mmdb  (default: /tmp/geoip/GeoLite2-City.mmdb)
#   --index <name>    Index name prefix   (default: demo-geoip; timestamped: demo-geoip-YYYYMMDD)
#   --country <cc>    Filter to one country code

import argparse
import ipaddress
import json
import sys
from datetime import datetime, timezone

import maxminddb

parser = argparse.ArgumentParser()
parser.add_argument('--mmdb',    default='/tmp/geoip/GeoLite2-City.mmdb')
parser.add_argument('--index',   default=None,
                    help='Index name (default: demo-geoip-YYYYMMDD using today)')
parser.add_argument('--country', default=None)
args = parser.parse_args()

ts = datetime.now(timezone.utc)
index = args.index or f'demo-geoip-{ts.strftime("%Y%m%d")}'

seen = {}  # code -> ip string

with maxminddb.open_database(args.mmdb) as reader:
    # maxminddb yields (network, record) — network first
    for network, record in reader:
        if not isinstance(network, ipaddress.IPv4Network):
            continue
        if not record:
            continue

        country = record.get('country') or record.get('registered_country')
        if not country:
            continue
        cc = country.get('iso_code')
        if not cc:
            continue
        if args.country and cc != args.country:
            continue

        subdivisions = record.get('subdivisions') or []
        if not subdivisions:
            continue

        sub_code = subdivisions[-1].get('iso_code')
        if not sub_code:
            continue

        full_code = f'{cc}-{sub_code}'
        if full_code in seen:
            continue

        # first usable host in network
        if network.prefixlen == 32:
            ip = str(network.network_address)
        else:
            ip = str(network.network_address + 1)
        seen[full_code] = ip

iso_ts = ts.isoformat()
for code, ip in seen.items():
    cc = code.split('-')[0]
    print(json.dumps({"index": {"_index": index}}))
    print(json.dumps({"ip": ip, "expected_ems_code": code, "label": cc, "@timestamp": iso_ts}))

print(f'seed: {len(seen)} documents written to index {index}', file=sys.stderr)

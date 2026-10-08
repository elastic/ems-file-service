# Generate france_regions_v1.geo.json from Sophox export + admin_regions_lvl2_v2
#
# To regenerate:
#   1. Run the SPARQL query in sources/fr/regions_v1.hjson on https://sophox.org
#   2. Export as GeoJSON (precision=0.000001) → sources/fr/france_regions_v1_sophox.geo
#      (.geo extension avoids being picked up by the sources/**/*.*json build glob)
#   3. make data/france_regions_v1.geo.json

OVERSEAS := FR-GF,FR-GP,FR-MQ,FR-RE,FR-YT
OVERSEAS_FILTER := ['$(OVERSEAS)'.split(',')]

data/france_regions_v1.geo.json: sources/fr/france_regions_v1_sophox.geo data/admin_regions_lvl2_v2.geo.json
	node scripts/clean-geom.js -o /tmp/fr_regions_cleaned.geo.json $<
	npx mapshaper \
	  -i /tmp/fr_regions_cleaned.geo.json name=sophox \
	  -i data/admin_regions_lvl2_v2.geo.json name=lvl2 \
	  -target lvl2 \
	  -filter "['FR-GF','FR-GP','FR-MQ','FR-RE','FR-YT'].includes(region_iso_code)" \
	  -join sophox keys=region_iso_code,iso_3166_2 fields=label_en,label_fr,insee \
	  -rename-fields iso_3166_2=region_iso_code \
	  -drop fields=region_name,country_iso2_code,country_iso3_code,country_name \
	  -target sophox \
	  -filter "!['FR-GF','FR-GP','FR-MQ','FR-RE','FR-YT'].includes(iso_3166_2)" \
	  -merge-layers target=sophox,lvl2 force \
	  -o $@ precision=0.000001 force

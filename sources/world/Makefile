DATA_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../../data)
.DEFAULT_GOAL := all

.PHONY: all
all: ../../data/admin_regions_lvl2_v2.topo.json ../../data/admin_regions_lvl2_v2.geo.json ../../data/admin_regions_lvl2_v1.geo.json ../../data/world_countries_v7.topo.json ../../data/world_countries_v7.geo.json # Main target for all resulting datasets

.PHONY: clean
clean: ## Remove output files
	rm -f $(DATA_DIR)/admin_regions_lvl2_v1.geo.json \
  $(DATA_DIR)/admin_regions_lvl2_v2.topo.json \
  $(DATA_DIR)/admin_regions_lvl2_v2.geo.json \
  $(DATA_DIR)/world_countries_v7.topo.json \
  $(DATA_DIR)/world_countries_v7.geo.json \
   /tmp/wikidata.csv /tmp/area.csv /tmp/population.csv \
   /tmp/missing-area.csv /tmp/missing-population.csv \
   /tmp/ne_10m_admin_1_states_provinces.topo.json \
   /tmp/additional-regions.geo.json

/tmp/ne_10m_admin_1_states_provinces.topo.json: ## Uncompress the NE regions dataset
	gunzip --keep ./ne_10m_admin_1_states_provinces.topo.json.gz
	mv ne_10m_admin_1_states_provinces.topo.json /tmp

/tmp/ne_10m_admin_1_states_provinces.geo.json: /tmp/ne_10m_admin_1_states_provinces.topo.json
	mapshaper -i /tmp/ne_10m_admin_1_states_provinces.topo.json \
  -o format=geojson /tmp/ne_10m_admin_1_states_provinces.geo.json

/tmp/additional-regions.geo.json: /tmp/ne_10m_admin_1_states_provinces.geo.json ./duplicated-regions.csv
	cd ../../scripts && \
  node duplicate-regions.js -v \
    ../sources/world/duplicated-regions.csv \
    /tmp/ne_10m_admin_1_states_provinces.geo.json \
    /tmp/additional-regions.geo.json

../../data/admin_regions_lvl2_v2.topo.json: /tmp/ne_10m_admin_1_states_provinces.topo.json /tmp/additional-regions.geo.json ## Regions TopoJSON
	mapshaper -i   combine-files \
  /tmp/ne_10m_admin_1_states_provinces.topo.json /tmp/additional-regions.geo.json \
  -merge-layers force \
  -dissolve "iso_3166_2" copy-fields="iso_3166_2,name,iso_a2,adm0_a3,admin" \
  -filter "this.properties.iso_3166_2 !== ''" \
  -filter "this.properties.iso_a2 !== '-1'" \
  -rename-fields "region_iso_code=iso_3166_2,region_name=name,country_iso2_code=iso_a2,country_iso3_code=adm0_a3,country_name=admin" \
  -simplify visvalingam interval=300 keep-shapes \
  -rename-layers data \
  -sort this.properties.region_iso_code \
  -o format=topojson id-field=region_iso_code prettify $(DATA_DIR)/admin_regions_lvl2_v2.topo.json

../../data/admin_regions_lvl2_v2.geo.json: ../../data/admin_regions_lvl2_v2.topo.json ## Regions GeoJSON full size
	mapshaper -i $(DATA_DIR)/admin_regions_lvl2_v2.topo.json \
  -sort this.properties.region_iso_code \
  -o rfc7946 id-field=region_iso_code format=geojson force /tmp/admin_regions_lvl2_v2.geo.json
	node ../../scripts/clean-geom.js -v /tmp/admin_regions_lvl2_v2.geo.json
	mapshaper -i /tmp/admin_regions_lvl2_v2.geo.json \
  -filter-fields "region_iso_code,region_name,country_iso2_code,country_iso3_code,country_name" \
  -o rfc7946 id-field=region_iso_code format=geojson prettify $(DATA_DIR)/admin_regions_lvl2_v2.geo.json

../../data/admin_regions_lvl2_v1.geo.json: ../../data/admin_regions_lvl2_v2.topo.json ## Regions GeoJSON simplified
	mapshaper -i $(DATA_DIR)/admin_regions_lvl2_v2.topo.json \
  -simplify visvalingam interval=1000 keep-shapes \
  -sort this.properties.region_iso_code \
  -o rfc7946 id-field=region_iso_code format=geojson force /tmp/admin_regions_lvl2_v1.geo.json
	node ../../scripts/clean-geom.js -v /tmp/admin_regions_lvl2_v1.geo.json
	mapshaper -i /tmp/admin_regions_lvl2_v1.geo.json \
  -filter-fields "region_iso_code,region_name,country_iso2_code,country_iso3_code,country_name" \
  -o rfc7946 id-field=region_iso_code format=geojson prettify $(DATA_DIR)/admin_regions_lvl2_v1.geo.json

/tmp/population.csv: ## Population data from the World Bank API
	echo "iso,measure" > /tmp/population.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> /tmp/population.csv

/tmp/area.csv: ## Country area data from the World Bank API
	echo "iso,measure" > /tmp/area.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/AG.LND.TOTL.K2?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> /tmp/area.csv

/tmp/isos.csv: ../../data/admin_regions_lvl2_v1.geo.json ## Country ISO identifiers from the regions dataset
	cat $(DATA_DIR)/admin_regions_lvl2_v1.geo.json |\
  jq -r '.features[] | .properties.country_iso3_code + "," + .properties.country_iso2_code' |\
  uniq | sort > /tmp/isos.csv

/tmp/missing-area.csv: /tmp/isos.csv /tmp/area.csv ## Missing areas from the World Bank dataset
	csvsql -H  --query 'select isos.b from isos left join area on isos.a = area.a where area.b is null ' /tmp/isos.csv /tmp/area.csv |\
  tail +2 > /tmp/missing-area.csv


/tmp/missing-population.csv: /tmp/isos.csv /tmp/population.csv ## Missing population from the World Bank dataset
	csvsql -H  --query 'select isos.b from isos left join population on isos.a = population.a where population.b is null ' /tmp/isos.csv /tmp/population.csv |\
  tail +2 > /tmp/missing-population.csv

/tmp/wikidata.csv: /tmp/missing-area.csv /tmp/missing-population.csv ## Wikidata area and population for the missing records
	codes=$$(sort /tmp/missing-area.csv /tmp/missing-population.csv | uniq | awk '{ print "\""$$0"\""}') && curl -H "Accept: text/csv" -sG 'https://query.wikidata.org/sparql' --data-urlencode query="SELECT ?iso2 (MAX(?p) AS ?population) (MAX(?a) AS ?area) WHERE { VALUES ?iso2 { $${codes}  } ?id wdt:P297 ?iso2; wdt:P2046 ?a; wdt:P1082 ?p. } GROUP BY ?iso2 ORDER BY ?iso2" > /tmp/wikidata.csv

# Data including metrics
../../data/world_countries_v7_metrics.geo.json: ../../data/admin_regions_lvl2_v2.geo.json /tmp/additional-regions.geo.json /tmp/area.csv /tmp/population.csv /tmp/wikidata.csv  ## World Countries GeoJSON full size
	codesA=$$(csvsql --query 'select distinct in_region_iso from "duplicated-regions" where not keep' duplicated-regions.csv | tail +2 | sed -e 's/^/"/g' -e 's/$$/"/g' | paste -sd "," -) && codesB=$$(csvsql --query 'select distinct out_region_iso2 as iso from "duplicated-regions" where keep' duplicated-regions.csv | tail +2 | sed -e 's/^/"/g' -e 's/$$/"/g' | paste -sd "," -) && mapshaper -i $(DATA_DIR)/admin_regions_lvl2_v2.geo.json \
  -filter "[$${codesA},$${codesB}].indexOf(region_iso_code) == -1" \
  -dissolve 'country_iso2_code' 'copy-fields=country_iso3_code,country_name' \
  -rename-fields "iso2=country_iso2_code,iso3=country_iso3_code,name=country_name" \
  -join /tmp/area.csv 'keys=iso3,iso' 'fields=measure' \
  -rename-fields "area=measure" \
  -join /tmp/population.csv 'keys=iso3,iso' 'fields=measure' \
  -rename-fields "population=measure" \
  -join /tmp/wikidata.csv 'keys=iso2,iso2' 'fields=area,population' force \
  -rename-layers data \
  -sort this.properties.iso2 \
  -clean \
  -o rfc7946 id-field=iso2 format=geojson force /tmp/world_countries_v7.geo.json
	node ../../scripts/clean-geom.js -v /tmp/world_countries_v7.geo.json
	mapshaper -i /tmp/world_countries_v7.geo.json \
  -filter-fields "iso2,iso3,name,area,population" \
  -o rfc7946 id-field=iso2 format=geojson prettify $(DATA_DIR)/world_countries_v7_metrics.geo.json

../../data/world_countries_v7_metrics.topo.json: ../../data/world_countries_v7.geo.json ## World Countries TopoJSON
	mapshaper -i $(DATA_DIR)/world_countries_v7.geo.json \
  -simplify visvalingam interval=1000 keep-shapes \
  -filter-fields "iso2,iso3,name,area,population" \
  -rename-layers data \
  -sort this.properties.iso2 \
  -clean \
  -o format=topojson id-field=iso2 prettify $(DATA_DIR)/world_countries_v7_metrics.topo.json


# Data without metrics
../../data/world_countries_v7.geo.json: ../../data/admin_regions_lvl2_v2.geo.json /tmp/additional-regions.geo.json ./country-codes.csv ## World Countries GeoJSON full size
	codesA=$$(csvsql --query 'select distinct in_region_iso from "duplicated-regions" where not keep' duplicated-regions.csv | tail +2 | sed -e 's/^/"/g' -e 's/$$/"/g' | paste -sd "," -) && codesB=$$(csvsql --query 'select distinct out_region_iso2 as iso from "duplicated-regions" where keep' duplicated-regions.csv | tail +2 | sed -e 's/^/"/g' -e 's/$$/"/g' | paste -sd "," -) && mapshaper -i $(DATA_DIR)/admin_regions_lvl2_v2.geo.json \
  -filter "[$${codesA},$${codesB}].indexOf(region_iso_code) == -1" \
  -dissolve 'country_iso2_code' 'copy-fields=country_iso3_code,country_name' \
  -rename-fields "iso2=country_iso2_code,iso3=country_iso3_code,name=country_name" \
  -join ./country-codes.csv "keys=iso2,iso2" "string-fields=iso_numeric" \
  -rename-layers data \
  -sort this.properties.iso2 \
  -clean \
  -o rfc7946 id-field=iso2 format=geojson force /tmp/world_countries_v7.geo.json
	node ../../scripts/clean-geom.js -v /tmp/world_countries_v7.geo.json
	mapshaper -i /tmp/world_countries_v7.geo.json \
  -filter-fields "iso2,iso3,iso_numeric,name" \
  -o rfc7946 id-field=iso2 format=geojson prettify $(DATA_DIR)/world_countries_v7.geo.json

../../data/world_countries_v7.topo.json: ../../data/world_countries_v7.geo.json ## World Countries TopoJSON
	mapshaper -i $(DATA_DIR)/world_countries_v7.geo.json \
  -simplify visvalingam interval=1000 keep-shapes \
  -filter-fields "iso2,iso3,iso_numeric,name" \
  -rename-layers data \
  -sort this.properties.iso2 \
  -clean \
  -o format=topojson id-field=iso2 prettify $(DATA_DIR)/world_countries_v7.topo.json

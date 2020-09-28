.DEFAULT_GOAL := ../../data/world_countries_v1.geo.json

clean: ## Remove output files
	rm -f ../../data/admin_regions_lvl2_v1.geo.json \
  ../../data/admin_regions_lvl2_v2.topo.json \
  ../../data/world_countries_v1.geo.json \
  ../../data/world_countries_v7.topo.json \
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

../../data/admin_regions_lvl2_v2.topo.json: /tmp/ne_10m_admin_1_states_provinces.topo.json /tmp/additional-regions.geo.json ## Regions GeoJSON
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
  -o format=topojson prettify ../../data/admin_regions_lvl2_v2.topo.json

../../data/admin_regions_lvl2_v1.geo.json: ../../data/admin_regions_lvl2_v2.topo.json ## Regions TopoJSON
	mapshaper -i ../../data/admin_regions_lvl2_v2.topo.json \
  -simplify visvalingam interval=1000 keep-shapes \
  -sort this.properties.region_iso_code \
  -o rfc7946 format=geojson prettify ../../data/admin_regions_lvl2_v1.geo.json
	node ../../scripts/clean-geom.js -v ../../data/admin_regions_lvl2_v1.geo.json

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
	cat ../../data/admin_regions_lvl2_v1.geo.json |\
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

../../data/world_countries_v7.topo.json: ../../data/admin_regions_lvl2_v1.geo.json /tmp/area.csv /tmp/population.csv /tmp/wikidata.csv ## World Countries TopoJSON
	mapshaper -i ../../data/admin_regions_lvl2_v1.geo.json \
  -dissolve 'country_iso2_code' 'copy-fields=country_iso3_code,country_name' \
  -rename-fields "iso2=country_iso2_code,iso3=country_iso3_code,name=country_name" \
  -join /tmp/area.csv 'keys=iso3,iso' 'fields=measure' \
  -rename-fields "area=measure" \
  -join /tmp/population.csv 'keys=iso3,iso' 'fields=measure' \
  -rename-fields "population=measure" \
  -join /tmp/wikidata.csv 'keys=iso2,iso2' 'fields=area,population' force \
  -simplify visvalingam interval=1000 keep-shapes \
  -rename-layers data \
  -sort this.properties.iso2 \
  -o format=topojson prettify ../../data/world_countries_v7.topo.json

../../data/world_countries_v1.geo.json: ../../data/world_countries_v7.topo.json ## World Countries GeoJSON
	mapshaper -i ../../data/world_countries_v7.topo.json \
  -simplify visvalingam interval=3000 keep-shapes \
  -sort this.properties.region_iso_code \
  -o rfc7946 format=geojson prettify ../../data/world_countries_v1.geo.json
	node ../../scripts/clean-geom.js -v ../../data/world_countries_v1.geo.json

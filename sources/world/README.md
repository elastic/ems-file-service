# World datasets

**Note** commands assume a copy of the [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector) is located on this folder as `naturalearth`.

You can run `make` to generate the datasets, but mind that you need the following commands in your Operating System: [`jq`](https://stedolan.github.io/jq), [`csvsql`](https://csvkit.readthedocs.io/en/1.0.2/scripts/csvsql.html), and [`mapshaper`](https://github.com/mbloch/mapshaper) apart from the common `curl`, `awk`, etc. 


## Administrative Divisions

The Administrative divisions layer contains second level subdivisions (first level where no second level subdivision exists) of world countries. This layer was derived from the [Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) layer from [Natural Earth](https://www.naturalearthdata.com) with supplemental boundaries from [OpenStreetMap](https://www.openstreetmap.org) where Natural Earth data is known to be incomplete or erroneous.

This dataset is best viewed at a scale of 1:10 million or smaller (zoom levels 0-6 on a [tiled web map](https://en.wikipedia.org/wiki/Tiled_web_map)). 

Maps of world countries and administrative divisions are known to have biases and opinions. Users of this product are recommended to inspect the data to ensure it conforms with local laws and customs.

### Mapshaper scripts used


* Additional China Provinces (e.g. Taiwan)
```
mapshaper -i naturalearth/10m_cultural/ne_10m_admin_1_states_provinces.shp \
  -filter "['TW'].indexOf(iso_a2) > -1" \
  -dissolve copy-fields="iso_3166_2,name,iso_a2,adm0_a3,admin" \
  -each "iso_3166_2='CN-TW',name='Taiwan'" \
  -o /tmp/china_states.shp
```

* Convert to TopoJSON
```
mapshaper -i combine-files naturalearth/10m_cultural/ne_10m_admin_1_states_provinces.shp \
  /tmp/china_states.shp \
  -merge-layers force \
  -filter "this.properties.iso_3166_2 !== ''" \
  -filter "this.properties.iso_a2 !== '-1'" \
  -filter-fields "name,iso_3166_2,iso_a2,adm0_a3,admin" \
  -rename-fields "region_iso_code=iso_3166_2,region_name=name,country_iso2_code=iso_a2,country_iso3_code=adm0_a3,country_name=admin" \
  -simplify visvalingam interval=300 keep-shapes \
  -rename-layers data \
  -sort this.properties.region_iso_code \
  -o format=topojson prettify ../../data/admin_regions_lvl2_v2.topo.json
```

* Convert to GeoJSON (EMS v1)
```
mapshaper -i combine-files ../../data/admin_regions_lvl2_v2.topo.json \
  -simplify visvalingam interval=1000 keep-shapes \
  -sort this.properties.region_iso_code \
  -o rfc7946 format=geojson prettify ../../data/admin_regions_lvl2_v1.geo.json
```

* Fix for invalid geometries in the GeoJSON file
```
node ../../scripts/clean-geom.js -v ../../data/admin_regions_lvl2_v1.geo.json
```

## World Countries

### Getting metrics from the World Bank database

* Getting the total population
```
echo "iso,measure" > /tmp/population.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> /tmp/population.csv
```

* Getting the area in square kilometers
```
echo "iso,measure" > /tmp/area.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/AG.LND.TOTL.K2?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> /tmp/area.csv
```

### Getting population and area data from wikidata

After this process, there are still some records without area or population, we will complete the dataset with Wikidata information. To get the list of the missing countries we will filter using `csvsql` from the `csvkit` package over a finished dataset.

* Get the country iso codes from the regions dataset
```
cat ../../data/admin_regions_lvl2_v1.geo.json |\
  jq -r '.features[] | .properties.country_iso3_code + "," + .properties.country_iso2_code' |\
  uniq | sort > /tmp/isos.csv
```

* Get the list of missing countries for the area and population fields, and merge them to get the list of ISO2 codes of the missing countries
```
csvsql -H  --query 'select isos.b from isos left join area on isos.a = area.a where area.b is null ' /tmp/isos.csv /tmp/area.csv |\
  tail +2 > /tmp/missing-area.csv

csvsql -H  --query 'select isos.b from isos left join population on isos.a = population.a where population.b is null ' /tmp/isos.csv /tmp/population.csv |\
  tail +2 > /tmp/missing-population.csv
```

* Run this SPARQL query against Wikidata query service
```
curl -H "Accept: text/csv" -sG 'https://query.wikidata.org/sparql' --data-urlencode query="SELECT 
  ?iso2
  (MAX(?p) AS ?population)
  (MAX(?a) AS ?area)
WHERE {
 VALUES ?iso2 {
  $(sort /tmp/missing-area.csv /tmp/missing-population.csv | uniq | awk '{ print "\""$0"\""}')
 }
 ?id wdt:P297 ?iso2;
     wdt:P2046 ?a;
     wdt:P1082 ?p.
}
GROUP BY ?iso2
ORDER BY ?iso2" > /tmp/wikidata.csv
```

### Mapshaper

Dissolve the regions dataset by `country_iso2_code` and join with the World Bank and Wikidata CSVs to generate both the GeoJSON and TopoJSON outputs, each with different simplification thresholds to generate around 2MB datasets.

```
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
```

```
mapshaper -i ../../data/world_countries_v7.topo.json \
  -simplify visvalingam interval=3000 keep-shapes \
  -sort this.properties.region_iso_code \
  -o rfc7946 format=geojson prettify ../../data/world_countries_v1.geo.json
```

And finally fix some invalid geometries in the GeoJSON file

```
node ../../scripts/clean-geom.js -v ../../data/world_countries_v1.geo.json
```
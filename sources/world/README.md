## Administrative Divisions

The Administrative divisions layer contains second level subdivisions (first level where no second level subdivision exists) of world countries. This layer was derived from the [Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) layer from [Natural Earth](https://www.naturalearthdata.com) with supplemental boundaries from [OpenStreetMap](https://www.openstreetmap.org) where Natural Earth data is known to be incomplete or erroneous.

This dataset is best viewed at a scale of 1:10 million or smaller (zoom levels 0-6 on a [tiled web map](https://en.wikipedia.org/wiki/Tiled_web_map)). 

Maps of world countries and administrative divisions are known to have biases and opinions. Users of this product are recommended to inspect the data to ensure it conforms with local laws and customs.

### Mapshaper scripts used

**Note** commands assume a copy of the [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector) is located on this folder as `naturalearth`.

* Additional China Provinces (e.g. Taiwan)
```
mapshaper -i naturalearth/10m_cultural/ne_10m_admin_1_states_provinces.shp \
-filter "['TW'].indexOf(iso_a2) > -1" \
-dissolve copy-fields="iso_3166_2,name,iso_a2,adm0_a3,admin" \
-each "iso_3166_2='CN-TW',name='Taiwan'" \
-o china_states.shp
```

* Convert to TopoJSON
```
mapshaper -i combine-files naturalearth/10m_cultural/ne_10m_admin_1_states_provinces.shp \
china_states.shp \
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
mapshaper -i combine-files naturalearth/10m_cultural/ne_10m_admin_1_states_provinces.shp \
china_states.shp \
-merge-layers force \
-filter "this.properties.iso_3166_2 !== ''" \
-filter "this.properties.iso_a2 !== '-1'" \
-filter-fields "name,iso_3166_2,iso_a2,adm0_a3,admin" \
-rename-fields "region_iso_code=iso_3166_2,region_name=name,country_iso2_code=iso_a2,country_iso3_code=adm0_a3,country_name=admin" \
-simplify visvalingam interval=1000 keep-shapes \
-sort this.properties.region_iso_code \
-o rfc7946 format=geojson prettify ../../data/admin_regions_lvl2_v1.geo.json
```

* Fix for invalid geometries in the GeoJSON file
```
node scripts/clean-geom.js -v data/admin_regions_lvl2_v1.geo.json
```


## World Countries

### Getting population and area data from wikidata

Run this query at <https://query.wikidata.org/> and save the result as a CSV.

```spaql
SELECT 
?iso2
(SAMPLE(?pop_value) AS ?pop)
WHERE {
 VALUES ?iso2 {
   "AD" "AE" "AF" "AG" "AI" "AL" "AM" "AO" "AQ" "AR" "AS" "AT" "AU" "AW" "AZ" "BA" "BB" "BD" "BE" "BF" "BG" "BH" "BI" "BJ" "BL" "BM" "BN" "BO" 
   "NL" "BR" "BS" "BT" "BW" "BY" "BZ" "CA" "CD" "CF" "CG" "CH" "CI" "CK" "CL" "CM" "CN" "TW" "CO" "CR" "CU" "CV" "CW" "CY" "CZ" "DE" "DJ" "DK" 
   "DM" "DO" "DZ" "EC" "EE" "EG" "EH" "ER" "ES" "ET" "FI" "FJ" "FK" "FM" "FO" "FR" "GA" "GB" "GD" "GE" "GG" "GH" "GI" "GL" "GM" "GN" "GQ" "GR" 
   "GS" "GT" "GU" "GW" "GY" "HK" "HM" "HN" "HR" "HT" "HU" "ID" "IE" "IL" "IM" "IN" "IO" "IQ" "IR" "IS" "IT" "JE" "JM" "JO" "JP" "KE" "KG" "KH"
   "KI" "KM" "KN" "KP" "KR" "KW" "KY" "KZ" "LA" "LB" "LC" "LI" "LK" "LR" "LS" "LT" "LU" "LV" "LY" "MA" "MC" "MD" "ME" "MF" "MG" "MH" "MK" "ML" 
   "MM" "MN" "MO" "MP" "MR" "MS" "MT" "MU" "MV" "MW" "MX" "MY" "MZ" "NA" "NC" "NE" "NF" "NG" "NI" "SX" "NO" "NP" "NR" "NU" "NZ" "OM" "PA" "PE" 
   "PF" "PG" "PH" "PK" "PL" "PM" "PN" "PS" "PT" "PW" "PY" "QA" "RO" "RS" "RU" "RW" "SA" "SB" "SC" "SD" "SE" "SG" "SH" "SI" "SK" "SL" "SM" "SN" 
   "SO" "SR" "SS" "ST" "SV" "SY" "SZ" "TC" "TD" "TF" "TG" "TH" "TJ" "TK" "TL" "TM" "TN" "TO" "TR" "TT" "TV" "TZ" "UA" "UG" "UM" "US" "PR" "UY" 
   "UZ" "VA" "VC" "VE" "VG" "VI" "VN" "VU" "WF" "WS" "XK" "YE" "ZA" "ZM" "ZW"
 }
 ?id wdt:P297 ?iso2;
     wdt:P1082 ?pop_value.
}
GROUP BY ?iso2
ORDER BY ?iso2
```

### Getting metrics from the World Bank database

* Getting the total population
```
export METRIC="SP.POP.TOTL" &&\
echo "iso,measure" > ${METRIC}.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/${METRIC}?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> ${METRIC}.csv
```

* Getting the area in square kilometers
```
export METRIC="AG.LND.TOTL.K2" &&\
echo "iso,measure" > ${METRIC}.csv &&\
  curl -s "http://api.worldbank.org/v2/country/all/indicator/${METRIC}?format=json&per_page=300&date=2018" |\
  jq -cr '.[1][] | select(.countryiso3code != "") | select(.value > 0) | .countryiso3code + "," + (.value | tostring)' |\
  sort >> ${METRIC}.csv
```

### Mapshaper

Dissolve the regions dataset by `country_iso2_code` and join with the World Bank CSVs to generate both the GeoJSON and TopoJSON outputs, each with different simplification thresholds to generate around 2MB datasets.

```
mapshaper -i ../../data/admin_regions_lvl2_v1.geo.json \
-dissolve 'country_iso2_code' 'copy-fields=country_iso3_code,country_name' \
-rename-fields "iso2=country_iso2_code,iso3=country_iso3_code,name=country_name" \
-join AG.LND.TOTL.K2.csv 'keys=iso3,iso' 'fields=measure' \
-rename-fields "area=measure" \
-join SP.POP.TOTL.csv 'keys=iso3,iso' 'fields=measure' \
-rename-fields "population=measure" \
-simplify visvalingam interval=3000 keep-shapes \
-sort this.properties.region_iso_code \
-o rfc7946 format=geojson prettify ../../data/world_countries_v1.geo.json
```

```
mapshaper -i ../../data/admin_regions_lvl2_v1.geo.json \
-dissolve 'country_iso2_code' 'copy-fields=country_iso3_code,country_name' \
-rename-fields "iso2=country_iso2_code,iso3=country_iso3_code,name=country_name" \
-join AG.LND.TOTL.K2.csv 'keys=iso3,iso' 'fields=measure' \
-rename-fields "area=measure" \
-join SP.POP.TOTL.csv 'keys=iso3,iso' 'fields=measure' \
-rename-fields "population=measure" \
-simplify visvalingam interval=1000 keep-shapes \
-rename-layers data \
-sort this.properties.iso2 \
-o format=topojson prettify ../../data/world_countries_v7.topo.json
```

And finally fix some invalid geometries in the GeoJSON file

```
node scripts/clean-geom.js -v data/world_countries_v1.geo.json
```
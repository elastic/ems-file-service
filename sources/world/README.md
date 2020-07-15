# Administrative Divisions

The Administrative divisions layer contains second level subdivisions (first level where no second level subdivision exists) of world countries. This layer was derived from the [Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) layer from [Natural Earth](https://www.naturalearthdata.com) with supplemental boundaries from [OpenStreetMap](https://www.openstreetmap.org) where Natural Earth data is known to be incomplete or erroneous.

This dataset is best viewed at a scale of 1:10 million or smaller (zoom levels 0-6 on a [tiled web map](https://en.wikipedia.org/wiki/Tiled_web_map)). 

Maps of world countries and administrative divisions are known to have biases and opinions. Users of this product are recommended to inspect the data to ensure it conforms with local laws and customs.

## Mapshaper scripts used

* Convert to TopoJSON
```
mapshaper -i 10m_cultural/ne_10m_admin_1_states_provinces.shp \
-filter "this.properties.iso_3166_2 !== ''" \
-filter-fields "name,iso_3166_2" \
-rename-fields "region_iso_code=iso_3166_2,region_name=name" \
-simplify visvalingam interval=300 keep-shapes \
-rename-layers data \
-sort this.properties.region_iso_code \
-o format=topojson prettify admin_regions_v2.topo.json
```

* Convert to GeoJSON (EMS v1)
```
mapshaper -i 10m_cultural/ne_10m_admin_1_states_provinces.shp \
-filter "this.properties.iso_3166_2 !== ''" \
-filter-fields "name,iso_3166_2" \
-rename-fields "region_iso_code=iso_3166_2,region_name=name" \
-simplify visvalingam interval=1000 keep-shapes \
-sort this.properties.region_iso_code \
-o rfc7946 format=geojson prettify admin_regions_v1.geo.json
```
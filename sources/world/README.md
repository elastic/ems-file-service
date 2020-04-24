# Administrative Divisions

Administrative subdivsions by Natural Earth. This is a de facto worldview with borders that do not necessarily conform to the laws and perspectives of individual countries.

Examples of disputed areas (not comprehensive)

- Taiwan
- Kashmir region
- Crimea

Download the [shapefile](https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip), unzip, and process using MapShaper [command-line tool](https://github.com/mbloch/mapshaper/wiki/Introduction-to-the-Command-Line-Tool):

```
mapshaper-xl ne_10m_admin_1_states_provinces.shp snap \
-clean \
-filter-fields iso_3166_2,name \
-sort this.properties.iso_a2 \
-rename-fields label_en=name \
-rename-layers data \
-o format=topojson prettify data/administrative_subdivisions_v2.topo.json
```

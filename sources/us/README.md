# USA Counties

The US Census Bureau has the most comprehensive county boundary data available. 


1. Click on the link in the `data` property of the `counties.hjson` file to download the compressed shapefile.
1. Extract the downloaded zip file to a new directory.
1. Use the [mapshaper command line tool](https://github.com/mbloch/mapshaper) to rename fields and convert to the proper file format; e.g.
```sh
mapshaper -i ~/Downloads/cb_2017_us_county_20m/cb_2017_us_county_20m.shp \
-sort this.properties.GEOID \
-rename-layers data \
-filter-fields GEOID,COUNTYNS,NAME \
-rename-fields fips=GEOID,gnis=COUNTYNS,label_en=NAME \
-o format=topojson prettify id-field=fips \
./data/usa_counties_v2.topo.json
```
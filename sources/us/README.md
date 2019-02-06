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
-simplify 0.9 \
-o format=topojson prettify id-field=fips \
./data/usa_counties_v2.topo.json
```

*Note: To maintain an established precedent with layer names in the English language, the `en`, `en-ca`, and `en-gb` human readable names in `counties.hjson` have been manually adjusted from singular to plural format.*

# USA Zip Codes

## v2
USA Zip Codes v2 was retrieved from now defunct GeoCommons open data website. It appears to have been generated from the 2000 Census Zip Code Tabulation Areas. USA Zip Codes v2 is replaced by USA Zip Codes v7 in Elastic Maps Service v7.0.

## v7

Zip codes for the United States are available as Zip Code Tabulation Areas (ZCTAs) created by the US Census Bureau. USA Zip Codes v7 was generated from the 2018 ZCTAs which is based on the 2010 census. The US Census Bureau identifies [major differences between the 2000 Census and 2010 Census ZCTAs](https://www.census.gov/geo/reference/zctas.html). 

The ZCTAs are extremely detailed and the 2018 shapefile is >500MB. To make ZCTAs suitable for visualizing in Elastic Maps Service we have to dramatically simplify the shapes. The ZCTA shapefile can be downloaded from the link in the `data` field in the `sources/us/zip_codes_v7.hjson` file.

The mapshaper command line program can be used to simplify the shapes while maintaining topology and the conversion from shapefile to TopoJSON. Mapshaper requires Node.js and can be installed with `npm i -g mapshaper`. 

```
mapshaper-xl tl_2018_us_zcta510.shp snap \
-simplify 0.1% \
-clean \
-filter-fields ZCTA5CE10 \
-sort this.properties.ZCTA5CE10 \
-rename-fields zip=ZCTA5CE10 \
-rename-layers data \
-o format=topojson prettify data/usa_zip_codes_v7.topo.json
```

Note, not all zip codes used by the US Postal Service have a corresponding boundary in the ZCTA. 
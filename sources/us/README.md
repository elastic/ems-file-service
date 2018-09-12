# USA Zip Codes

Zip codes for the United States are available as Zip Code Tabulation Areas (ZCTAs) created by the US Census Bureau.  The ZCTAs are extremely detailed and the 2017 shapefile is >500MB. To make ZCTAs suitable for visualizing in Elastic Maps Service we have to dramatically generalize the shapes. Additionally, we publish the layer as TopoJSON so it is only available in `v2` of the Elastic Maps Service (Kibana v6.2+). The ZCTA shapefile can be downloaded from the link in the `data` field in the `sources/us/zip_codes.hjson` file.

The mapshaper command line program can be used to simplify the shapes while maintaining topology and the conversion from shapefile to TopoJSON. Mapshaper requires Node.js and can be installed with `npm i -g mapshaper`. 

`mapshaper-xl ~/Downloads/tl_2017_us_zcta510/tl_2017_us_zcta510.shp snap -simplify 0.1% -filter-fields ZCTA5CE10 -rename-fields zip=ZCTA5CE10 -o format=topojson data/usa_zip_codes_v2.json`

Note, it's likely that not all zip codes used by the US Postal Service have a corresponding boundary in the ZCTA. 
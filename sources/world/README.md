# World datasets

You can run `make` to generate the datasets, but mind that you need the following commands in your Operating System: [`jq`](https://stedolan.github.io/jq), [`csvsql`](https://csvkit.readthedocs.io/en/1.0.2/scripts/csvsql.html), and [`mapshaper`](https://github.com/mbloch/mapshaper) apart from the common `gunzip`, `curl`, `awk`, etc. 

Maps of world countries and administrative divisions are known to have biases and opinions. Users of this product are recommended to inspect the data to ensure it conforms with local laws and customs.

## Administrative Divisions

The Administrative divisions layer contains second level subdivisions (first level where no second level subdivision exists) of world countries. This layer was derived from the [Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) layer from [Natural Earth](https://www.naturalearthdata.com) with supplemental boundaries from [OpenStreetMap](https://www.openstreetmap.org) where Natural Earth data is known to be incomplete or erroneous.

This dataset is best viewed at a scale of 1:10 million or smaller (zoom levels 0-6 on a [tiled web map](https://en.wikipedia.org/wiki/Tiled_web_map)). 

### Building steps

Check the `Makefile` for the complete picture:

1. Convert the regions dataset to TopoJSON
1. Convert to GeoJSON for older EMS users
1. Fix any invalid geometries in the GeoJSON file

## World Countries

The World Countries dataset is derived from the Administrative Divisions, using the ISO2 code to merge the regions together, along with the ISO3 code and the country name. Area and population metrics are added for each country to help on normalization procedures. 

### Building steps

Check the `Makefile` for the complete picture:

1. Get the country total population and land area (square kilometers) datasets from the World Bank API
1. Check for any records with missing area or population data
1. Get the missing information from [Wikidata Query Service](https://query.wikidata.org/)
1. Dissolve the regions dataset by `country_iso2_code` and join with the World Bank and Wikidata CSVs to generate both the GeoJSON and TopoJSON outputs, each with different simplification thresholds to generate reasonably sized datasets.
1. Finally fix some invalid geometries in the GeoJSON file

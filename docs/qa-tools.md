# Quality Assurance Tools

There are some tools in the `scripts` folder that may help on data management tasks, and to debug issues in the data and sources.

## `wikidata-labels.js`

This script simply receives a property identifier and will return all the label translations in a HJSON format suitable for a source definition.

```sh
$ node scripts/wikidata-labels.js Q838549
{
  an: Lista de municipios de Montenegro
  ar: بلدية في الجبل الأسود
  az: Çernoqoriyanın inzibati-ərazi bölgüsü
  be: Адміністрацыйны падзел Чарнагорыі
  be-tarask: Адміністрацыйна-тэрытарыяльны падзел Чарнагорыі
  bs: Administrativna podjela Crne Gore
  ca: Organització territorial de Montenegro
  cs: Obce a města v Černé Hoře
  de: Gemeinde in Montenegro
  el: Δήμος του Μαυροβουνίου
  en: municipality of Montenegro
...
```

## `clean-geom.js`

This tool takes a GeoJSON file and attempts to fix any invalid geometry using the well known _buffer(0)_ approach. By default it will modify the file in place, but a different file path can be passed to leave the original file untouched.

```sh
$ node scripts/clean-geom.js 
Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --verbose, -v  Log about the process                [boolean] [default: false]
  --output, -o   Write the output GeoJSON in a different path           [string]

Examples:
  clean-geom.js in.geojson                 Overwrites your file
  clean-geom.js -o fix.geojson in.geojson  Leaves your input file as is

Elastic, 2019
```

## `fixgeometries.py`

If `clean-geom.js` is not able to fix your geometries, this backup script may be useful. It depends on the [QGIS processing framework](https://docs.qgis.org/3.4/en/docs/training_manual/processing/index.html), and its native implementation to fix geometries. To use it you need to have a recent version of PyQGIS correctly installed, add the plugins folder to your `PYTHONPATH` and run it.

```sh
$ PYTHONPATH=/usr/share/qgis/python/plugins \
  python3 scripts/fixgeometries.py data.geojson data.fixed.geojson
```


## `move-ids.js`

This tool is aimed for GeoJSON files that have the feature identifier inside the `properties` key, and promotes it to the `feature` level. It just takes the GeoJSON path and will return the result to the standard output.

```sh
node scripts/move-ids.js data.geojson > data.fixed.geojson
```

## `layerdiff.js`

It's always convenient to review the differences between data layers. Besides a visual exploration using a tool like [QGIS](https://qgis.org) or <https://geojson.io>, this tool provides an analytical comparison to check both layers have the same features, and then highlights differences in feature properties, geometry area, geometry centroid, and optionally the number of inner parts for every feature geometry. It also accepts to use a different identifier to merge the datasets and an specific identifier to only run the comparison checks on a single feature. Finally, the thresholds for area difference and centroid distances can be configured for fine tuning.

```sh
$ node scripts/layerdiff.js -h
Options:
  --version            Show version number                             [boolean]
  --verbose, -v        More verbose output            [boolean] [default: false]
  --field-id, -i       Use a property as identifier, by default the id from the
                       feature will be used                             [string]
  --check-id, -c       Check a single feature with the provided ID      [string]
  --area-diff, -a      Area percentage difference to trigger an alert
                                                           [number] [default: 1]
  --centroid-dist, -d  Distance in meters of the centroids that trigger an alert
                                                        [number] [default: 1000]
  --check-parts, -p    Enable to compare the number of parts on multipolygons
                                                      [boolean] [default: false]
  -h, --help           Show help                                       [boolean]

Examples:
  layerdiff old.geojson new.geojson  Compare two files
  layerdiff -i INSEE old new         Compare using a custom property
  layerdiff -c Q43121 old new        Compare given ID feature

Elastic, 2020
```

An alternative approach to check only feature properties and using `vimdiff` and `jq` can be:

```sh
$ vimdiff \
 <(jq --sort-keys '.features[].properties' < data/germany_states_v1.geo.json) \
 <(git show master:data/germany_states_v1.geo.json | jq --sort-keys '.features[].properties')
```

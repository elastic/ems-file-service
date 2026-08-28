# France departments

Prior to EMS 7.0, the France departments vector layer included overseas territories claimed by France. These territories have no INSEE or ISO 3166-2 codes (note: this refers to collectivités d'outre-mer such as French Polynesia and New Caledonia — not the 5 overseas departments/regions (DROMs), which do have both ISO 3166-2 and INSEE codes). The uncoded territories have been removed from the vector layer in EMS 7.0+.

It is still possible to use the previous version of the France departments vector layer in Kibana 7.0+ by [configuring the `map.regionmap` setting in `kibana.yml`](https://www.elastic.co/guide/en/kibana/current/settings.html). 

For example:
```
map.regionmap:
  layers:
    - name: "France Territories"
      url: "https://vector.maps.elastic.co/files/france_departments_v1.geo.json?elastic_tile_service_tos=agree"
      attribution: "[OpenStreetMap contributors](http://www.openstreetmap.org/copyright)"
      fields:
        - name: "iso_3166_2"
          description: "ISO 3166-2 code"
        - name: "insee"
          description: "INSEE department code"
        - name: "label_en"
          description: "name (en)"
        - name: "label_fr"
          description: "name (fr)"

```

## Update

When addressing the [absence of Lyon region](https://github.com/elastic/ems-file-service/issues/133) and generating the new France departments GeoJSON file, the data retrieved from Sophox yielded invalid geometries that the current [cleaning script](https://github.com/elastic/ems-file-service/blob/master/scripts/clean-geom.js) is not able to resolve. A new script that uses [QGIS processing framework](https://docs.qgis.org/3.4/en/docs/training_manual/processing/index.html) and its native implementation to fix geometries has been added. To use it you need to have a recent version of PyQGIS correctly installed, add the plugins folder to your `PYTHONPATH` and run it:

```
$ PYTHONPATH=/usr/share/qgis/python/plugins python3 scripts/fixgeometries.py /tmp/in.geo.json /tmp/out.geo.json
```

## France regions (`france_regions_v1`)

Standalone layer with 18 administrative regions: 13 metropolitan (`Q36784`) + 5 overseas DROMs (`Q202216`): Guadeloupe (`FR-GP`), Martinique (`FR-MQ`), French Guiana (`FR-GF`), Réunion (`FR-RE`), Mayotte (`FR-YT`).

Fields: `iso_3166_2` (id), `label_en`, `label_fr`, `insee`.

### Regenerating the dataset

1. Run the SPARQL query in `sources/fr/regions_v1.hjson` on [Sophox](https://sophox.org).
2. Export as GeoJSON with `precision=0.000001` and save to `sources/fr/france_regions_v1_sophox.geo`.
   Use the `.geo` extension — files ending in `*json` in `sources/` are picked up by the build as source definitions.
3. From the repo root, run:

```
$ make data/france_regions_v1.geo.json
```

The `Makefile` recipe:
- Runs `scripts/clean-geom.js` to fix invalid geometries from the Sophox export
- Uses `mapshaper` to replace overseas DROM geometries with land-clipped versions from `admin_regions_lvl2_v2`
- Outputs the final file to `data/france_regions_v1.geo.json`

If `clean-geom.js` is insufficient to fix geometries, fall back to `scripts/fixgeometries.py` (requires PyQGIS — see above) and re-run the `make` recipe.

**Wikidata P300 mismatch**: Wikidata stores `FR-971`..`FR-976` for overseas regions in P300 instead of the ISO 3166-2 codes (`FR-GP`, `FR-MQ`, `FR-GF`, `FR-RE`, `FR-YT`). The SPARQL query remaps these via `BIND`.


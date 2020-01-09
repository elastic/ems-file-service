# France departments

Prior to EMS 7.0, the France departments vector layer included overseas territories claimed by France. These territories have no INSEE or ISO 3166-2 codes. The uncoded territories have been removed from the vector layer in EMS 7.0+. 

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


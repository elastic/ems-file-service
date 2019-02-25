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
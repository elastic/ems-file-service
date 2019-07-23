# Argentina

Use `sed`  to remove unwanted "Provincia de(l)" and "Province" from labels.

```shell
sed -i.tmp -e s/"Provincia de[l]* "//g -e s/" Province"//g data/argentina_provinces_v1.geo.json
```

Note, Buenos Aires Province and the Autonomous City of Buenos Aires are separate entities, but they both may use the label "Buenos Aires". We may need to manually change the labels for the feature with ISO 3166-2 id "AR-C" to 

```json
"label_es": "Ciudad Autónoma de Buenos Aires",
"label_en": "Autonomous City of Buenos Aires"
```
# Ecuador

Use `sed`  to remove unwanted "Provincia de(l)" and "Province" from labels.


```sh
sed -i.tmp -e s/"Provincia de[l]* "//g -e s/" Province"//g data/ecuador_provinces_v1.geo.json 
```
# Chile

Use `sed` to remove unnecessary qualifiers in labels of Chile subdivisions. Review carefully as some manual editing of labels may still be required.  

```sh
sed -i.tmp -e s/"Región de[l]* "//g -e s/" Region"//g data/chile_regions_v1.geo.json 
```
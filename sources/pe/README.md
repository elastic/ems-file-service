# Peru

Use `sed` to remove unnecessary qualifiers in labels of subdivisions. Review carefully as some manual editing of labels may still be required.  

```
sed -i.tmp -e s/" [jach'a ]*suyu"//g -e s/"Región de[l]* "//g -e s/" Region"//g data/peru_regions_v1.geo.json 
```
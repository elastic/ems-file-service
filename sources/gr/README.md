# Greece

Use `sed` to remove "Region" from subdivision labels.

```
sed -i.tmp -e s/" Region"//g data/greece_regions_v1.geo.json 
```
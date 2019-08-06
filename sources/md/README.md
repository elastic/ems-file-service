# Moldova

Use `sed` to remove "raionul" and "District" from subdivision labels.

```
sed -i.tmp -e s/"raionul "//g -e s/" District"//g data/moldova_districts_v1.geo.json 
```
# Moldova

Use `sed` to remove "Municipality", "Municipiul", "raionul", and "District" from subdivision labels.

```
sed -i.tmp -e s/" Municipality"//gi -e s/"Municipiul "//gi -e s/"raionul "//gi -e s/" District"//gi data/moldova_districts_v1.geo.json 
```
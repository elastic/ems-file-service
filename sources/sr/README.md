# Suriname

Use `sed`  to remove the unnecessary "District" from subdivision labels.

```
sed -i.tmp -e s/" District"//g data/suriname_districts_v1.geo.json 
```

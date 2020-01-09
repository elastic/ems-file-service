# Romania

Use `sed` to remove "County" from subdivision labels.

```
sed -i.tmp -e s/" County"//g data/romania_counties_v1.geo.json 
```
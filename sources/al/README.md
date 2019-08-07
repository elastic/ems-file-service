# Albania

Use `sed` to remove "Qarku i" and "County" from subdivision labels.

```
sed -i.tmp -e s/"Qarku i "//gi -e s/" County"//gi data/albania_counties_v1.geo.json 
```
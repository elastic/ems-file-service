# Paraguay

Use `sed` to remove "Tetãvore", "Departamento (de(l))", and "Department" from subdivision labels.

```sh
sed -i.tmp -e s/"Tetãvore "//g -e s/"Departamento[ de[l]*]* "//g -e s/" Department"//g data/paraguay_departments_v1.geo.json
```
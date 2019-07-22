# Uruguay

Use `sed` to remove "Departamento (de(l))" and "Department" from subdivision labels.

```
sed -i.tmp -e s/"Departamento de[l]* "//g -e s/" Department"//g data/uruguay_departments_v1.geo.json
```
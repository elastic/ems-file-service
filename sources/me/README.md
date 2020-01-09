# Montenegro

Use `sed` to remove "Komuna e" and "Municipality" from subdivision labels.

```
sed -i.tmp -e s/"Komuna e "//gi -e s/" Municipality"//gi data/ 
```
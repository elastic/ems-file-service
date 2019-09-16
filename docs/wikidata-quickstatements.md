# Example: Using QuickStatements to quickly add missing OSM relations to Wikidata

Almost all municipalities in Montenegro were missing the OSM Relation ID in their respective Wikidata pages. For our default Sophox query to work, we need to have the OSM Relation ID filled. 

I created this Sophox query to find all relations in OSM where the ISO-3166-2 code starts with "ME-". The query also federates with Wikidata to exclude Wikidata entities that already have the OSM Relation ID defined. 

```
SELECT DISTINCT ?qid ?P402
WHERE {
  ?P402 osmt:ISO3166-2 ?iso_3166_2;
         osmm:type 'r';
         osmt:wikidata ?qid.
  FILTER (regex(str(?iso_3166_2), "^ME-[0-9]{2}$", "i"))
  SERVICE <https://query.wikidata.org/sparql> {
    OPTIONAL {?qid wdt:P402 ?osm }
    MINUS {?qid wdt:P402 ?osm}
  }
}
```

The results of this query are Wikidata entities that I needed to fix. Rather than fixing each page individually, I used the [QuickStatements tool](https://www.wikidata.org/wiki/Help:QuickStatements). I exported the results of the Sophox query to CSV and modified the CSV file to remove the URI prefixes, leaving only the Wikidata and OSM IDs. The OSM IDs also need to be contained by three double-quotes so they don't get parsed as integers by QuickStatements.

For example
```diff
 qid,P402
-http://www.wikidata.org/entity/Q13365880,https://www.openstreetmap.org/relation/2319539
-http://www.wikidata.org/entity/Q3296677,https://www.openstreetmap.org/relation/2317936
+Q13365880,"""2319539"""
+Q3296677,"""2317936"""
...
```

Open the [QuickStatements webpage](https://tools.wmflabs.org/quickstatements/#/) and start a New Batch. Copy and paste the CSV file (including headers) into the QuickStatements text box and click the Import CSV Commands button. Then click the Run box to make the edits. 
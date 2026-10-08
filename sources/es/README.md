# Spanish provinces and autonomous communities

For the `v8` version of the Spanish layers we split the previous layer into Autonomous Communities and Provinces. Because there are communities that only have a single province, the Wikidata entries have **two** ISO codes preventing to get them separately, so the entities where retrieved from OSM primarily instead from Wikidata. Check the differences between the two sources for comparison.

On the other hand the geometries for the provinces retrieved from Sophox had a few topological errors. We had to manually fix a geometry using QGIS and then use the `fixgeometries.py` script to automatically fix the rest  of the since the node script was removing a full enclave of one of the provinces.
## Refreshing the autonomous communities properties

The ISO 3166-2 codes and labels of `spain_autonomous_communities_v8` come from Wikidata. To pick up upstream changes without touching the geometries, run this command from the repository root:

```
$ make refresh-spain-autonomous-communities
```

The recipe runs `scripts/refresh-properties.js`. The script re-runs the SPARQL query of `autonomous-communities.hjson` on Sophox and updates the feature properties of `data/spain_autonomous_communities_v8.geo.json` in place. It matches features by their Wikidata id. If Wikidata moves a community to a new item, add an `--id-map OLD=NEW` argument to the recipe.

In 2026 this process fixed the Navarre community code from `ES-NA` to `ES-NC` ([#772](https://github.com/elastic/ems-file-service/issues/772)). `ES-NA` is the code of the Navarre province.

# Spanish provinces and autonomous communities

For the `v8` version of the Spanish layers we split the previous layer into Autonomous Communities and Provinces. Because there are communities that only have a single province, the Wikidata entries have **two** ISO codes preventing to get them separately, so the entities where retrieved from OSM primarly instead from Wikidata. Check the differences between the two sources for comparison.

On the other hand the geometries for the provinces retrieved from Sophox had a few topological errors. We had to manually fix a geometry using QGIS and then use the `fixgeometries.py` script to automatically fix the rest  of the since the node script was removing a full enclave of one of the provinces.
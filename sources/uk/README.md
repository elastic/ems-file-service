# United Kingdom Subdivisions

Not all subdivision boundaries of the United Kingdom are available in OpenStreetMap. Thus we use Open Data from other sources.

- [Ordnance Survey Boundary Line](https://www.ordnancesurvey.co.uk/business-and-government/products/boundaryline.html)
- [OSNI Local Government Districts 2012](http://osni-spatial-ni.opendata.arcgis.com/datasets/a55726475f1b460c927d1816ffde6c72_2)

## Data Production for Elastic Maps Service

The Open Datasets have the [ISO 3166-2 Codes](https://www.iso.org/obp/ui/#iso:code:3166:GB). However, both datasets have the nine-character GSS codes from the [Office for National Statistics Code History Database](https://ons.maps.arcgis.com/home/item.html?id=9ed0cdba2b7141bc8ae8821d107e1207).

A CSV file containing both the GSS and ISO 3166-2 codes can be downloaded from the [Wikidata Query Service](https://query.wikidata.org) using [this query](https://query.wikidata.org/#%23defaultView%3ATable%0A%23%20version%208%0ASELECT%0A%28if%28bound%28%3Fid2%29%2C%3Fid2%2C%3Fid%29%20as%20%3Fid%29%0A%3Fiso_3166_2%20%3Fgss_code%20%3Flabel_en%0AWHERE%20%7B%0A%20%20%23%20Using%20nested%20query%20to%20ensure%20there%20is%20only%20one%20%3Fid2%20value%0A%20%20%7BSELECT%0A%20%20%20%3Fid%0A%20%20%20%28SAMPLE%28%3Fid2%29%20as%20%3Fid2%29%0A%20%20%20%28SAMPLE%28%3Fiso_3166_2%29%20as%20%3Fiso_3166_2%29%0A%20%20%20%28SAMPLE%28%3Flabel_en%29%20as%20%3Flabel_en%29%0A%20%20%20%28SAMPLE%28%3Fgss_code%29%20as%20%3Fgss_code%29%0A%20%20%20WHERE%20%7B%0A%20%20%20%20%20%23%20List%20of%20regions%2C%20whose%20sub-regions%20we%20want.%0A%20%20%20%20%20VALUES%20%3Fentity%20%7B%20wd%3AQ145%20%7D%0A%0A%20%20%20%20%20%23%20P150%20%3D%20%22contains%20administrative%20territorial%20entity%22%0A%20%20%20%20%20%3Fentity%20wdt%3AP150%2a%20%3Fid%20.%20%0A%20%20%20%20%20%3Fid%20wdt%3AP300%20%3Fiso_3166_2%0A%0A%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fid%20rdfs%3Alabel%20%3Flabel_en%20.%20FILTER%28LANG%28%3Flabel_en%29%20%3D%20%22en%22%29%20%7D%0A%20%20%20%20%20OPTIONAL%20%7B%20%3Fid%20wdt%3AP836%20%3Fgss_code%20%7D%0A%20%20%20%7D%0A%20%20%20%23%20remove%20possible%20ID%20duplicates%0A%20%20%20GROUP%20BY%20%3Fid%20%0A%20%20%7D%0A%7D).

## Data License

[Open Government Licence v3.0](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)

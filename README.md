# Elastic Map Service Data Sources

Machine readable and standardized data sources for use in Elastic Map Service.

## Usage

Create a new JSON or [Hjson](http://hjson.org) file in the appropriate folder in `sources`. The source file must match the schema in `schema/source_schema.json`.

To validate data sources against the schema run

```node
npm test
```

To build manifests and vector data files for all versions run

```node
npm run build
```

## Continuous Integration and Deployment

- New feature layers can be developed on the `feature-layers` branch (`git checkout --track upstream/feature-layers`). Jenkins will build and deploy all commits to this branch into a testing bucket on GCP. Test feature layers on this branch in Kibana by adding `map.manifestServiceUrl: http://storage.googleapis.com/elastic-bekitzur-emsfiles-catalogue-dev/v7.2/manifest` to `config/kibana.yml`. 
- Pull requests for new feature layers should be made from the `feature-layers` against the `master` branch. Pull requests for any other changes should be made on a new branch in your fork, e.g. `git checkout -b my-bugfix`.
- Once merged, Jenkins will run `deployStaging.sh` script, which will place the contents of the `dist` directory into the staging bucket.
- Deploying to production requires manually triggering [this Jenkins job](https://kibana-ci.elastic.co/job/elastic+ems-file-service+deploy/) to run the `deployProduction.sh` script. This will rsync files from the staging bucket to the production bucket. To trigger, log in and click the "Build with Parameters" link. Leave the `branch_specifier` field as default (`refs/heads/master`).

## Adding a new country subdivision vector layer

Whenever possible new vector layers should be created using a SPARQL query in [Sophox](http://sophox.org). 

1. Checkout the upstream `feature-layers` branch.
1. If necessary, create a new folder in the `sources` directory with the corresponding two-digit country code (ex. `ru` for Russia).
1. Copy and paste the template source file (`templates/source_template.hjson`) into the new directory you created in step 1. Give it a useful name (ex. `states.hjson`, `provinces.hjson`, etc).
1. Complete the `note` and `name` fields in the new source file. 
1. Copy and paste the `query.sparql` value into the query box on http://sophox.org. 
1. Change the `Q33` in the `VALUES ?entity { wd:Q33 }` to the corresponding [Wikidata](https://www.wikidata.org) ID for the country for which you are adding subdivisions (ex. `Q33` is the [Wikidata ID for Finland](https://www.wikidata.org/wiki/Q33)).
1. Run the SPARQL query and compare the `iso_3166_2` results with the [corresponding country's subdivision list on the ISO website](https://www.iso.org/obp/ui/#search) looking for missing `iso_3166_2` codes.
1. The most common reason for missing `iso_3166_2` codes in the query results is an incomplete ["contains administrative territorial entity"](https://www.wikidata.org/wiki/Property:P150) property in the immediate parent region of the subdivision in Wikidata (usually, but not always, the country). You may need to add the subdivision Wikidata item to this property (ex. https://www.wikidata.org/wiki/Q33#P150).
1. Add `label_*` fields for each official language of the country to the SPARQL query similar to the `label_en` field.
1. Optionally, add unique subdivision code fields from other sources (ex. `logianm` in Ireland) to the query.
1. Run the SPARQL query and check the map output.
1. Optionally, click the "Simplify" link and drag the slider to reduce the number of vertices (smaller file size). 
1. Click the "Export" link on the top right of the map. Choose GeoJSON or TopoJSON as the File Format. 
1. Type `rfc7946` ƒin the "command line options" to reduce the precision of the coordinates and click "Export" to download the vector file.
1. Rename the downloaded file with the first supported EMS version number (ex. `_v1`, `_v2`, `_v6.6`) and the vector type (`geo` for GeoJSON, `topo` for TopoJSON) (ex. `russia_states_v1.geo.json`). Copy this file to the `data` directory. 
1. Complete the `emsFormats` properties: `type` is either `geojson` or `topojson`, `file` is the filename specified above, `default` is `true` when there is only one format. Subsequent formats can be added but only one item in the array can have `default: true`. The other items must be `default: false` or omit `default` entirely.
1. Copy and paste the SPARQL query from Sophox to the `query.sparql` field in the source file.
1. Use the `scripts/wikidata-labels.js` script to list the `humanReadableName` languages from Wikidata (e.g. `node scripts/wikidata-labels.js Q33`). You should spot check these translations as some languages might lack specificity (e.g. `Provins` rather than `Kinas provinser`).
1. We should maintain the current precedent for title casing `legacyIds` and English labels of the `humanReadableName`. This may need to be manually edited in the source (e.g. Paraguay Departments).
1. All fields used by sources that do not follow the `label_<language_code>`  schema must have translations in (schema/fields.hjson). If necessary, use the `scripts/wikidata-labels.js` script to list translations and copy them to (schema/fields.hjson) (e.g. `node scripts/wikidata-labels P5097`).
1. Use the following bash command to generate the timestamp for the `createdAt` field. Use `gdate` on Mac OSX.
`date -u +"%Y-%m-%dT%H:%M:%S.%6N"`
1. Generate a 17 digit number for the `id` field. A timestamp using the following bash command is suitable. Use `gdate` On Mac OSX. 
`date +%s%6N` 
1. The `filename` field in the source file should match the name of the file you added to the `data` directory.
1. Run `npm test` to test for errors.
1. Invalid or non-simple geometry errors that occur during testing can usually be fixed by running the `clean-geom.js` script against the GeoJSON file (e.g. `node scripts/clean-geom.js data/usa_states_v1.geo.json`).
1. Run `./build.sh` to build the manifest and blob files locally.

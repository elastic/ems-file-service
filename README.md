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

- The manifest and vector files for all versions will be built automatically by Jenkins on every pull request using the `build.sh` script. Pull requests must be made against the `master` branch. 
- Once merged, Jenkins will run `deployStaging.sh` script, which will place the contents of the `dist` directory into the staging bucket.
- Deploying to production requires manually triggering [this Jenkins job](https://kibana-ci.elastic.co/job/elastic+ems-file-service+deploy/) to run the `deployProduction.sh` script. This will rsync files from the staging bucket to the production bucket. To trigger, log in and click the "Build with Parameters" link. Leave the `branch_specifier` field as default (`refs/heads/master`).

## Adding a new country subdivision vector layer

Whenever possible new vector layers should be created using a SPARQL query in [Sophox](http://sophox.org). 

1. If necessary, create a new folder in the `sources` directory with the corresponding two-digit country code (ex. `ru` for Russia).
2. Copy and paste the template source file (`templates/source_template.hjson`) into the new directory you created in step 1. Give it a useful name (ex. `states.hjson`, `provinces.hjson`, etc).
3. Complete the `note`, `name` and `humanReadableName` fields in the new source file.
4. Copy and paste the `query.sparql` value into the query box on http://sophox.org. 
5. Change the `Q33` in the `VALUES ?entity { wd:Q33 }` to the corresponding [Wikidata](https://www.wikidata.org) ID for the country for which you are adding subdivisions (ex. `Q33` is the [Wikidata ID for Finland](https://www.wikidata.org/wiki/Q33)).
6. Run the SPARQL query and compare the `iso_3166_2` results with the [corresponding country's subdivision list on the ISO website](https://www.iso.org/obp/ui/#search) looking for missing `iso_3166_2` codes.
7. The most common reason for missing `iso_3166_2` codes in the query results is an incomplete ["contains administrative territorial entity"](https://www.wikidata.org/wiki/Property:P150) property in the immediate parent region of the subdivision in Wikidata (usually, but not always, the country). You may need to add the subdivision Wikidata item to this property (ex. https://www.wikidata.org/wiki/Q33#P150).
8. Add `label_*` fields for each official language of the country to the SPARQL query similar to the `label_en` field.
9. Optionally, add unique subdivision code fields from other sources (ex. `logianm` in Ireland) to the query.
10. Run the SPARQL query and check the map output.
11. Optionally, click the "Simplify" link and drag the slider to reduce the number of vertices (smaller file size). 
12. Click the "Export" link on the top right of the map. Choose GeoJSON or TopoJSON as the File Format. 
13. Type `rfc7946` in the "command line options" to reduce the precision of the coordinates and click "Export" to download the vector file.
14. Rename the downloaded file and give it a version number (ex. `russia_states_v1.json`) and copy it to the `data` directory. 
15. Copy and paste the SPARQL query from Sophox to the `query.sparql` field in the source file.
16. Use the following bash command to generate the timestamp for the `createdAt` field. Use `gdate` on Mac OSX.
`date -u +"%Y-%m-%dT%H:%M:%S.%6N"`
17. Generate a 17 digit number for the `id` field. A timestamp using the following bash command is suitable. Use `gdate` On Mac OSX. 
`date +%s%6N` 
18. The `filename` field in the source file should match the name of the file you added to the `data` directory.
19. Run `npm test` to test for errors.
20. Run `./build.sh` to build the manifest and blob files locally.

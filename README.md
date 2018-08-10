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

## Todo

- [ ] Build Jenkins job to periodically check for updates to vector data from sources and send notifications to Kibana GIS team.
- [ ] Test output vector data for regressions or missing features

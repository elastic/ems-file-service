# Elastic Map Service Data Sources

Machine readable and standardized data sources for use in Elastic Map Service.

## Usage

Create a new JSON or [Hjson](http://hjson.org) file in the appropriate folder in `sources`. The source file must match the schema in `schema/source_schema.json`.

To validate data sources against the schema run
```node
npm test
```

## Todo
- [] Automation scripts for downloading from sources
- [] More data sources

Based on schema and scripts located at http://github.com/openaddresses/openaddresses

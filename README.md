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

## Data

Data in the `v1` and `v2` branches are intended to match the V1 and V2 Elastic Map Service manifests, respectively. 

Data in the `v1` branch MUST BE GeoJSON only. 

Data in the `v2` branch can be GeoJSON or TopoJSON. GeoJSON is the preferred format. If the file size for GeoJSON data is too large, it may be converted to TopoJSON with the understanding that the dataset will not be available in `v1`.

### Data Editing Workflow

Until we have an automated pipeline we may need to manually correct data in the datasets. This is the preferred workflow.

1) If the dataset exists in both the `v1` and `v2` branches, checkout the `v1` branch.

    ``` git checkout v1```

    If the dataset exists only in the `v2` branch, checkout the `v2` branch.

    ```git checkout v2```

2) Makes requisite changes to the dataset in the `data` folder and commit to the current branch.

    ``` git commit -m 'YOUR COMMIT MESSAGE' ```

3) If the dataset exists in both `v1` and `v2`, checkout the `v2` branch and merge the changes from `v1`.
    ``` 
    git checkout v2
    git merge v1
    ```

4)  Merge the changes from the branch into master.
    ``` 
    git checkout master
    git merge v2
    ```

5) Push the changes to the repo.

    ```
    git push --all
    ```

6) Confirm the data changes with the #maps team in Slack and upload the dataset to https://staging-dot-elastic-layer.appspot.com/dashboard for testing.

7) Data may be uploaded to the production service with agreement by all members of the #maps team.
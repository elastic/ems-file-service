# Buildkite

Elastic is replacing Jenkins by Buildkite for many of the continous integration jobs, including EMS File Service.

The structure of metadata and business logic related to Buildkite in this repo is as follows:

* `catalog-info.yaml` contains two specs: one for EMS File Service as a `Component` including some details and links, and another with the Buildkite pipeline definition: owners, permissions, and integration settings for Github.
* `.buildkite/pull-requests.json` contains details on how the Elastic PR bot will process new pull requests to trigger or skip builds depending on the submitter, the files modified, and PR labels. It also defines a regular expression to allow manually triggering builds with a comment (`buildkite test this`).
* `.buildkite/pipeline.yml` contains the steps to execute on each build. There is an initial step that will run always to execute the test suite and then, depending on three different scenarios it will additionally run the `.buildkite/deploy.sh` script with a different value for `EMS_ENVIRONMENT`:
  * If the build is executed from a commit to `feature-layers` the deployment script will push the built assets into the **development** buckets.
  * If the build is executed from a commit to `master` the deployment script will push the built assets into the **staging** buckets.
  * If the build is executed from a git tag pushed to the repository, then a button will show in the Buildkite interface to wait for a human to approve the operation, then the script will push the built assets into the **production** buckets, including a compressed file in the archive bucket.
* `.buildkite/hooks/pre-command` contains a simple script that sets up a number of environment variables that will drive which buckets will be used to store the built assets. It also contains the `vault` path where the GCP credentials are stored.
* `.buildkite/deploy.sh` contains the logic to:
  * check for all the parameters to be available as environment variables,
  * retrieve the GCP credentials and log in
  * run the `yarn` commands to install the dependencies and build the assets
  * if an archive bucket is set, compress the assets and upload them
  * upload the assets to the `catalogue` and `vector` buckets


Buildkite will send a message to the `#maps-ops` Slack channel with the results of the build.


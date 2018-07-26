#!/bin/bash
set -e
set +x

# Two stage script: first it compiles using node docker container,
# then it runs itself from within another docker container to deploys to GCP

# Usage:
# * Compile and deploy:          ./deployStaging.sh
# * Deploy only without docker:  ./deployStaging.sh nodocker

# Expected env variables:
# * GPROJECT - "elastic-ems-prod" or "elastic-ems-dev"
# * GCE_ACCOUNT - credentials for the google service account (JSON blob)

if [[ -z "${GPROJECT}" ]]; then
    echo "GPROJECT is not set, e.g. 'GPROJECT=elastic-ems-prod'"
    exit 1
fi
if [[ -z "${GCE_ACCOUNT}" ]]; then
    echo "GCE_ACCOUNT is not set. Expected google service account JSON blob."
    exit 1
fi


if [[ "$1" != "nodocker" ]]; then

    ./build.sh

    # Run this script from inside the docker container, using google/cloud-sdk image
    echo "Deploying to staging environment"
    docker run \
        --rm -i \
        --env GCE_ACCOUNT \
        --env GIT_BRANCH \
        --env GPROJECT \
        --env HOME=/tmp \
        --volume $PWD:/app \
        --user=$(id -u):$(id -g) \
        --workdir /app \
        'google/cloud-sdk:slim' \
        /app/deployStaging.sh nodocker "$@"
    unset GCE_ACCOUNT

else

    # Copying files to the staging environment
    # Login to the cloud with the service account
    gcloud auth activate-service-account --key-file <(echo "$GCE_ACCOUNT")
    unset GCE_ACCOUNT


    # Copy files
    EMS_PROJECT=file-service
    STAGING_BUCKET=${GPROJECT}-${EMS_PROJECT}-staging
    echo "Copying $PWD/dist/* to gs://$STAGING_BUCKET"
    gsutil -m -h "Content-Type:application/json" cp -r -a public-read -Z "$PWD/dist/*" "gs://$STAGING_BUCKET"

fi

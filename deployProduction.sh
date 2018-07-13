#!/bin/bash
set -e
set +x

#     *** This job will ***
#  * build manifest.json and vector files into ./dist for all versions with NODE_ENV=production
#  * download and compress the ./dist into a single snapshot file
#  * upload snapshot file to the archive bucket
#  * copy ./dist/* to the live bucket

# The script runs in two stages: starts docker container, and runs itself inside the docker container to copy files to production

# Usage:
# * Deploy:                 ./deployProduction.sh
# * Deploy without docker:  ./deployProduction.sh nodocker

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

    # Run this script from inside the docker container, using google/cloud-sdk image

    NODE_ENV=production ./build.sh

    echo "Deploying to production environment"
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
        /app/deployProduction.sh nodocker "$@"
    unset GCE_ACCOUNT

else
    # Steps:  login, download live bucket to create zip snapshot, upload zip to archive bucket, rsync staging to live
    gcloud auth activate-service-account --key-file <(echo $GCE_ACCOUNT)
    unset GCE_ACCOUNT


    # all buckets must be different
    EMS_PROJECT=file-service
    STAGING_BUCKET=${GPROJECT}-${EMS_PROJECT}-staging
    PRODUCTION_BUCKET=${GPROJECT}-${EMS_PROJECT}-live
    ARCHIVE_BUCKET=${GPROJECT}-${EMS_PROJECT}-archive

    TIMESTAMP=`date +"%Y-%m-%d_%H-%M-%S"`
    SNAPSHOT_DIR=$PWD/${TIMESTAMP}_snapshot
    ZIP_FILE=${TIMESTAMP}_ems_fileservice.tar.gz
    ZIP_FILE_PATH=$PWD/$ZIP_FILE


    echo "Copying $PWD/dist/* to $SNAPSHOT_DIR"
    if [[ -d "$SNAPSHOT_DIR" ]]; then
        echo "$SNAPSHOT_DIR already exist"
        exit 1
    fi
    mkdir -p "$SNAPSHOT_DIR"
    cp -r "$PWD/dist/*" "$SNAPSHOT_DIR"

    echo "Archiving bucket into $ZIP_FILE_PATH"
    tar -czvf "$ZIP_FILE_PATH" -C "$SNAPSHOT_DIR" .

    set +e
    if gsutil -q stat "gs://$ARCHIVE_BUCKET/$ZIP_FILE" ; then
        echo ERROR: snapshot file "gs://$ARCHIVE_BUCKET/$ZIP_FILE" already exists 1>&2
        exit 1
    fi
    set -e

    echo "Copying $ZIP_FILE_PATH snapshot to gs://$ARCHIVE_BUCKET"
    gsutil cp "$ZIP_FILE_PATH" "gs://$ARCHIVE_BUCKET"

    set +e
    if ! gsutil -q stat "gs://$ARCHIVE_BUCKET/$ZIP_FILE" ; then
        echo ERROR: snapshot file "gs://$ARCHIVE_BUCKET/$ZIP_FILE" did not upload successfully 1>&2
        exit 1
    fi
    set -e

    echo "Syncing $PWD/dist/* to gs://$PRODUCTION_BUCKET"
    gsutil -m cp -r -a public-read -Z -h "Content-Type:application/json" "$PWD/dist/*" "gs://$PRODUCTION_BUCKET"

fi

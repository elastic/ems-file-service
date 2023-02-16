#!/bin/bash

#
# Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
# or more contributor license agreements. Licensed under the Elastic License;
# you may not use this file except in compliance with the Elastic License.
#

set -e
set +x

# Two stage script: first it compiles using node docker container,
# then it runs itself from within another docker container to deploys to GCP

# Usage:
# * Compile and deploy:          ./build.sh
# * Deploy only without docker:  ./build.sh nodocker

# Expected env variables:
# * [GCE_ACCOUNT] - credentials for the google service account (JSON blob)
# * [TILE_HOST] - "tiles.maps.elastic.co" or "tiles.maps.elstc.co" (default)
# * [VECTOR_HOST] - "vector.maps.elastic.co" or "vector-staging.maps.elastic.co" (default)
# * [CATALOGUE_BUCKET] - "elastic-bekitzur-emsfiles-catalogue" or "elastic-bekitzur-emsfiles-catalogue-staging"
# * [VECTOR_BUCKET] - "elastic-bekitzur-emsfiles-vector" or "elastic-bekitzur-emsfiles-vector-staging".
#                     If VECTOR_BUCKET or CATALOGUE_BUCKET is not set, the files are built locally but not uploaded.
# * [ARCHIVE_BUCKET] - "elastic-bekitzur-emsfiles-archive"
#                      If ARCHIVE_BUCKET is set, a timestamped snapshot of the files is uploaded to the bucket.

if [[ -z "${VECTOR_HOST}" ]]; then
    VECTOR_HOST="vector-staging.maps.elastic.co"
    echo "VECTOR_HOST is not set. Defaulting to '${VECTOR_HOST}'."
fi

if [[ -z "${TILE_HOST}" ]]; then
    TILE_HOST="tiles.maps.elstc.co"
    echo "TILE_HOST is not set. Defaulting to '${TILE_HOST}'."
fi

if [[ "$1" != "nodocker" ]]; then

    NODE_IMG="node:hydrogen"

    echo "Generating manifests and vector data files for all versions using ${NODE_IMG} docker image"
    docker pull $NODE_IMG
    docker run --rm -i \
        --env VECTOR_HOST \
        --env TILE_HOST \
        --env GIT_COMMITTER_NAME=test \
        --env GIT_COMMITTER_EMAIL=test \
        --env HOME=/tmp \
        --user=$(id -u):$(id -g) \
        --volume $PWD:/app \
        --workdir /app \
        $NODE_IMG \
        bash -c '/opt/yarn*/bin/yarn && yarn test && yarn run build'

    if [[ -n "${VECTOR_BUCKET}" && -n "${CATALOGUE_BUCKET}" ]]; then
        # Run this script from inside the docker container, using google/cloud-sdk image
        echo "Deploying vector files to ${VECTOR_HOST}"
        docker run \
            --rm -i \
            --env GCE_ACCOUNT \
            --env GPROJECT \
            --env VECTOR_HOST \
            --env TILE_HOST \
            --env VECTOR_BUCKET \
            --env CATALOGUE_BUCKET \
            --env ARCHIVE_BUCKET \
            --env EMS_PROJECT \
            --env HOME=/tmp \
            --volume $PWD:/app \
            --user=$(id -u):$(id -g) \
            --workdir /app \
            'google/cloud-sdk:slim' \
            /app/build.sh nodocker "$@"
        unset GCE_ACCOUNT
    else
        echo "No data will be uploaded. The following bucket information is not set:"
        if [[ -z "${VECTOR_BUCKET}" ]]; then
          echo "VECTOR_BUCKET"
        fi
        if [[ -z "${CATALOGUE_BUCKET}" ]]; then
          echo "CATALOGUE_BUCKET"
        fi
    fi

else

    if [[ -z "${GCE_ACCOUNT}" ]]; then
        echo "GCE_ACCOUNT is not set. Expected google service account JSON blob."
        exit 1
    fi

    # Copying files to the cloud
    # Login to the cloud with the service account
    gcloud auth activate-service-account --key-file <(echo "$GCE_ACCOUNT")
    unset GCE_ACCOUNT

    if [[ -n "${ARCHIVE_BUCKET}" ]]; then
        TIMESTAMP=`date +"%Y-%m-%d_%H-%M-%S"`
        SNAPSHOT_DIR=$PWD/${TIMESTAMP}_snapshot
        ZIP_FILE=${TIMESTAMP}_${EMS_PROJECT}.tar.gz
        ZIP_FILE_PATH=$PWD/$ZIP_FILE

        echo "Copying $PWD/dist/* to $SNAPSHOT_DIR"
        if [[ -d "$SNAPSHOT_DIR" ]]; then
            echo "$SNAPSHOT_DIR already exist"
            exit 1
        fi
        mkdir -p "$SNAPSHOT_DIR"
        cp -r $PWD/dist/* "$SNAPSHOT_DIR"

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
    fi

    # Copy catalogue manifest
    echo "Copying $PWD/dist/catalogue* to gs://$CATALOGUE_BUCKET"
    gsutil -m -h "Content-Type:application/json" -h "Cache-Control:public, max-age=3600" cp -r -Z $PWD/dist/catalogue/* "gs://$CATALOGUE_BUCKET"

    # Copy vector files
    echo "Copying $PWD/dist/vector* to gs://$VECTOR_BUCKET"
    gsutil -m -h "Content-Type:application/json" -h "Cache-Control:public, max-age=3600" cp -r -Z $PWD/dist/vector/* "gs://$VECTOR_BUCKET"

fi

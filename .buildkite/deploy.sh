#!/bin/bash

#
# Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
# or more contributor license agreements. Licensed under the Elastic License;
# you may not use this file except in compliance with the Elastic License.
#

set -e
set +x

# Script to deploy the assets for EMS File Service

# Expected env variables:
# * [GCS_VAULT_SECRET_PATH] -  Path to retrieve the credentials for the google service account (JSON blob)
# * [TILE_HOST] - "tiles.maps.elastic.co" or "tiles.maps.elstc.co" (default)
# * [VECTOR_HOST] - "vector.maps.elastic.co" or "vector-staging.maps.elastic.co" (default)
# * [CATALOGUE_BUCKET] - "elastic-bekitzur-emsfiles-catalogue" or "elastic-bekitzur-emsfiles-catalogue-staging"
# * [VECTOR_BUCKET] - "elastic-bekitzur-emsfiles-vector" or "elastic-bekitzur-emsfiles-vector-staging".
#                     If VECTOR_BUCKET or CATALOGUE_BUCKET is not set, the files are built locally but not uploaded.
# * [ARCHIVE_BUCKET] - "elastic-bekitzur-emsfiles-archive"
#                      If ARCHIVE_BUCKET is set, a timestamped snapshot of the files is uploaded to the bucket.

function retry {
    local retries=$1
    shift

    local count=0
    until "$@"; do
        exit=$?
        wait=$((2 ** count))
        count=$((count + 1))
        if [ $count -lt "$retries" ]; then
            >&2 echo "Retry $count/$retries exited $exit, retrying in $wait seconds..."
            sleep $wait
        else
            >&2 echo "Retry $count/$retries exited $exit, no more retries left."
            return $exit
        fi
    done
    return 0
}


# Download build from "test" step
echo "Getting the EMS Files from the previous step..."
buildkite-agent artifact download "dist.tar" . --step test
tar xf dist.tar

if [[ -z "${VECTOR_HOST}" ]]; then
    VECTOR_HOST="vector-staging.maps.elastic.co"
    echo "VECTOR_HOST is not set. Defaulting to '${VECTOR_HOST}'."
fi

if [[ -z "${TILE_HOST}" ]]; then
    TILE_HOST="tiles.maps.elstc.co"
    echo "TILE_HOST is not set. Defaulting to '${TILE_HOST}'."
fi

if [[ -z "${CATALOGUE_BUCKET}" || -z "${VECTOR_BUCKET}" ]]; then
    echo "No data will be uploaded. The following bucket information is not set:"
    if [[ -z "${VECTOR_BUCKET}" ]]; then
        echo "VECTOR_BUCKET"
    fi
    if [[ -z "${CATALOGUE_BUCKET}" ]]; then
        echo "CATALOGUE_BUCKET"
    fi
fi

export GCE_ACCOUNT_SECRET=$(retry 5 vault read --field=value ${GCS_VAULT_SECRET_PATH})
unset GCS_VAULT_SECRET_PATH

if [[ -z "${GCE_ACCOUNT_SECRET}" ]]; then
    echo "GCP credentials not set. Expected google service account JSON blob."
    exit 1
fi

# Copying files to the cloud
# Login to the cloud with the service account
gcloud auth activate-service-account --quiet --key-file <(echo "$GCE_ACCOUNT_SECRET")
unset GCE_ACCOUNT_SECRET

if [[ -n "${ARCHIVE_BUCKET}" ]]; then
    TIMESTAMP=`date +"%Y-%m-%d_%H-%M-%S"`
    SNAPSHOT_DIR="./${TIMESTAMP}_snapshot"
    ZIP_FILE=${TIMESTAMP}_${EMS_PROJECT}.tar.gz
    ZIP_FILE_PATH=./$ZIP_FILE

    echo "Copying ./dist/* to $SNAPSHOT_DIR"
    if [[ -d "$SNAPSHOT_DIR" ]]; then
        echo "$SNAPSHOT_DIR already exist"
        exit 1
    fi
    mkdir -p "$SNAPSHOT_DIR"
    cp -r ./dist/* "$SNAPSHOT_DIR"

    echo "Archiving bucket into $ZIP_FILE_PATH"
    tar -czvf "$ZIP_FILE_PATH" -C "$SNAPSHOT_DIR" .

    set +e
    if gsutil -q stat "gs://$ARCHIVE_BUCKET/$ZIP_FILE" ; then
        echo ERROR: snapshot file "gs://$ARCHIVE_BUCKET/$ZIP_FILE" already exists 1>&2
        exit 1
    fi
    set -e

    echo "\n\n========================================================================="
    echo "Copying $ZIP_FILE_PATH snapshot to gs://$ARCHIVE_BUCKET"
    echo "=========================================================================\n"
    gsutil cp "$ZIP_FILE_PATH" "gs://$ARCHIVE_BUCKET"

    set +e
    if ! gsutil -q stat "gs://$ARCHIVE_BUCKET/$ZIP_FILE" ; then
        echo ERROR: snapshot file "gs://$ARCHIVE_BUCKET/$ZIP_FILE" did not upload successfully 1>&2
        exit 1
    fi
fi

# Copy catalogue manifest
echo "\n\n========================================================================="
echo "Copying ./dist/catalogue* to gs://$CATALOGUE_BUCKET"
echo "=========================================================================\n"
gsutil -m -h "Content-Type:application/json" -h "Cache-Control:public, max-age=3600" cp -r -Z ./dist/catalogue/* "gs://$CATALOGUE_BUCKET"

# Copy vector files
echo "\n\n========================================================================="
echo "Copying ./dist/catalogue* to gs://$VECTOR_BUCKET"
echo "=========================================================================\n"
gsutil -m -h "Content-Type:application/json" -h "Cache-Control:public, max-age=3600" cp -r -Z ./dist/vector/* "gs://$VECTOR_BUCKET"

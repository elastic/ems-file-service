#!/bin/bash
set -e
set +x

# Two stage script: first it compiles using node docker container,
# then it runs itself from within another docker container to deploys to GCP

# Usage:
# * Compile and deploy:          ./build.sh
# * Deploy only without docker:  ./build.sh nodocker

# Expected env variables:
# * [GCE_ACCOUNT] - credentials for the google service account (JSON blob)
# * [TARGET_HOST] - "vector.maps.elastic.co" or "staging-dot-elastic-layer.appspot.com" (default)
# * [TARGET_BUCKET] - "elastic-ems-prod-file-service-live" or "elastic-ems-prod-file-service-staging".
#                     If TARGET_BUCKET is not set, the files are built locally but not uploaded.
# * [ARCHIVE_BUCKET] - "elastic-ems-prod-file-service-archive"
#                      If ARCHIVE_BUCKET is set, a timestamped snapshot of the files is uploaded to the bucket.

if [[ -z "${TARGET_HOST}" ]]; then
    echo "TARGET_HOST is not set. Defaulting to 'staging-dot-elastic-layer.appspot.com'."
fi

if [[ "$1" != "nodocker" ]]; then

    NODE_IMG="node:8"

    echo "Generating manifests and vector data files for all versions using ${NODE_IMG} docker image"
    docker pull $NODE_IMG
    docker run --rm -i \
        --env TARGET_HOST \
        --env GIT_COMMITTER_NAME=test \
        --env GIT_COMMITTER_EMAIL=test \
        --env HOME=/tmp \
        --user=$(id -u):$(id -g) \
        --volume $PWD:/app \
        --workdir /app \
        $NODE_IMG \
        bash -c 'npm config set spin false && /opt/yarn*/bin/yarn && yarn test && yarn run build'

    if [[ -n "${TARGET_BUCKET}" ]]; then
        # Run this script from inside the docker container, using google/cloud-sdk image
        echo "Deploying to ${TARGET_HOST}"
        docker run \
            --rm -i \
            --env GCE_ACCOUNT \
            --env GPROJECT \
            --env TARGET_HOST \
            --env TARGET_BUCKET \
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
        echo "TARGET_BUCKET is not set. No data will be uploaded."
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

    # Copy files
    echo "Copying $PWD/dist/* to gs://$TARGET_BUCKET"
    gsutil -m cp -r -a public-read -Z -h "Content-Type:application/json" $PWD/dist/* "gs://$TARGET_BUCKET"

fi

#!/bin/bash
set -e
set +x

# Expected env variables:
# * GPROJECT - e.g. "elastic-ems"
# * GCE_ACCOUNT - credentials for the google service account (JSON blob)

if [[ -z "${GPROJECT}" ]]; then
    echo "GPROJECT is not set, e.g. 'GPROJECT=elastic-ems-prod'"
    exit 1
fi

export EMS_PROJECT="file-service"

export TARGET_HOST="staging-dot-elastic-layer.appspot.com"
export TARGET_BUCKET=${GPROJECT}-${EMS_PROJECT}-staging

unset ARCHIVE_BUCKET

./build.sh

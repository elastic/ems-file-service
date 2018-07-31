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
if [[ -z "${GCE_ACCOUNT}" ]]; then
    echo "GCE_ACCOUNT is not set. Expected google service account JSON blob."
    exit 1
fi

export EMS_PROJECT="file-service"

export TARGET_HOST="vector.maps.elastic.co"
export TARGET_BUCKET=${GPROJECT}-${EMS_PROJECT}-live
export ARCHIVE_BUCKET=${GPROJECT}-${EMS_PROJECT}-archive

./build.sh

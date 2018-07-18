#!/bin/bash
set -e
set +x

# Expected env variables:
# * GCE_ACCOUNT - credentials for the google service account (JSON blob)
# * GPROJECT - e.g. "elastic-ems"

export EMS_PROJECT="file-service"

export TARGET_HOST="vector.maps.elastic.co"
export TARGET_BUCKET=${GPROJECT}-${EMS_PROJECT}-live
export ARCHIVE_BUCKET=${GPROJECT}-${EMS_PROJECT}-archive

./build.sh

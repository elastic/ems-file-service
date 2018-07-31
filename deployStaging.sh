#!/bin/bash
set -e
set +x

# Expected env variables:
# * GCE_ACCOUNT - credentials for the google service account (JSON blob)
# * GPROJECT - e.g. "elastic-ems"

export EMS_PROJECT="file-service"

export TARGET_HOST="staging-dot-elastic-layer.appspot.com"
export TARGET_BUCKET=${GPROJECT}-${EMS_PROJECT}-staging

./build.sh

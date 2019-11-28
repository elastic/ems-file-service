#!/bin/bash

#
# Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
# or more contributor license agreements. Licensed under the Elastic License;
# you may not use this file except in compliance with the Elastic License.
#

set -e
set +x

# Expected env variables:
export HTTP_PROTOCOL="http://"
export HTTP_PORT=8000

export TILE_HOST="custom.tiles.maps.elastic.co"
export TILE_PATH=""

export VECTOR_HOST="custom.files.maps.elastic.co"
export VECTOR_PATH="vector/"

export DOCKER_IMAGE_NAME="ems-file-service"
export DOCKER_IMAGE_VERSION="0.0.1"


./build.sh

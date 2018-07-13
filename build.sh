#!/bin/bash
set -e

NODE_IMG="node:8"

# Generate v2 manifest
echo "Generating manifest.json and vector data files for all versions using ${NODE_IMG} docker image"
docker pull $NODE_IMG
docker run --rm -i \
    --env NODE_ENV \
    --env GIT_COMMITTER_NAME=test \
    --env GIT_COMMITTER_EMAIL=test \
    --env HOME=/tmp \
    --user=$(id -u):$(id -g) \
    --volume $PWD:/app \
    --workdir /app \
    $NODE_IMG \
    bash -c 'npm i && npm test && npm run build'
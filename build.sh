#!/bin/bash
set -e

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

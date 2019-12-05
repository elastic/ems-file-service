FROM nginx:alpine

LABEL MAINTAINER "Jorge Sanz <jorge.sanz@elastic.co>"

# Bring environment variables and default values
ARG ARG_HTTP_PROTOCOL="https://"
ENV HTTP_PROTOCOL=${ARG_HTTP_PROTOCOL}

ARG ARG_VECTOR_HOST="files.maps.elastic.co"
ENV VECTOR_HOST=${ARG_VECTOR_HOST}

ARG ARG_TILE_HOST="tiles.maps.elastic.co"
ENV TILE_HOST=${ARG_TILE_HOST}

ARG ARG_HTTP_PORT="80"
ENV HTTP_PORT=${ARG_HTTP_PORT}

ARG ARG_VECTOR_PATH=""
ENV VECTOR_PATH=${ARG_VECTOR_PATH}

ARG ARG_TILE_PATH=""
ENV TILE_PATH=${ARG_TILE_PATH}

ARG ARG_DOCKER_IMAGE_NAME="ems-file-service"
ENV DOCKER_IMAGE_NAME=${ARG_DOCKER_IMAGE_NAME}

ARG ARG_DOCKER_IMAGE_VERSION="0.0.1"
ENV DOCKER_IMAGE_VERSION=${ARG_DOCKER_IMAGE_VERSION}

EXPOSE ${HTTP_PORT}

# Copy sources
RUN rm -rf /usr/share/nginx/html/*
COPY ./dist /usr/share/nginx/html/
COPY ./templates/nginx.conf /etc/nginx/conf.d/template

# Replace environment variables and run nginx
CMD /bin/sh -c "echo \"Using the following environment variables:${HTTP_PROTOCOL}|${VECTOR_HOST}|${TILE_HOST}|${HTTP_PORT}|${VECTOR_PATH}|${TILE_PATH}\"; envsubst '\${HTTP_PROTOCOL} \${VECTOR_HOST} \${TILE_HOST} \${HTTP_PORT} \${VECTOR_PATH} \${TILE_PATH}' < /etc/nginx/conf.d/template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"

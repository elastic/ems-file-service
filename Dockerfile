FROM nginx:alpine

LABEL MAINTAINER "Jorge Sanz <jorge.sanz@elastic.co>"

ARG ARG_VECTOR_HOST="localhost"
ENV VECTOR_HOST=${ARG_VECTOR_HOST}

# Copy sources
COPY ./dist /usr/share/nginx/html/
COPY ./templates/nginx.conf /etc/nginx/conf.d/template

# Replace environment variables and run nginx
CMD /bin/sh -c "envsubst < /etc/nginx/conf.d/template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"

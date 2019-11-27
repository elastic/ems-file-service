FROM nginx:alpine

LABEL MAINTAINER "Jorge Sanz <jorge.sanz@elastic.co>"

# Install requisites
RUN apk add --no-cache nodejs npm

# Copy sources
COPY . /tmp/ems/
COPY ./templates/nginx.conf /etc/nginx/conf.d/default.conf

# Test and build the distribution
RUN cd /tmp/ems &&\
  npm install &&\
  npm test &&\
  npm run-script build &&\
  rm -rf /usr/share/nginx/html/* &&\
  cp -ar /tmp/ems/dist/* /usr/share/nginx/html/

# Clean up
RUN apk del nodejs npm && rm -rf /tmp/ems

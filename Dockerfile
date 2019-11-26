FROM nginx:alpine

LABEL MAINTAINER "Jorge Sanz <jorge.sanz@elastic.co>"

RUN rm -rf /usr/share/nginx/html/*

COPY ./templates/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./dist /usr/share/nginx/html

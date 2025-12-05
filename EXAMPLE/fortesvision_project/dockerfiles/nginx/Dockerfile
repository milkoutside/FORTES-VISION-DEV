FROM nginx:stable-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

WORKDIR /var/www

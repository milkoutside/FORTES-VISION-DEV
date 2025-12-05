FROM node:20-alpine

RUN apk add --no-cache supervisor
RUN npm i -g laravel-echo-server@^1.6.2

COPY supervisord.conf /etc/supervisord.conf
COPY laravel-echo-server.json /etc/laravel-echo-server.json

EXPOSE 6001

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

FROM library/node:10.12.0-alpine

MAINTAINER ric03uec <devashish@shippable.com>

RUN mkdir -p /ot

ADD . /ot

WORKDIR /ot

RUN npm install

ENTRYPOINT npm start

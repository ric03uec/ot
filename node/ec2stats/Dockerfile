FROM library/node:10.12.0-alpine
MAINTAINER ric03uec <devashish@shippable.com>

RUN mkdir -p /stats

ADD . /ec2stats

WORKDIR /ec2stats

RUN npm install

ENTRYPOINT npm start

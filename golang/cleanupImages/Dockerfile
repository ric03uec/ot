FROM library/golang:1.11.2

MAINTAINER ric03uec <devashish@shippable.com>

RUN curl https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
RUN mkdir -p /go/src/github.com/ric03uec/

ENV GOPATH=/go
ENV PROJECT_DIR=$GOPATH/src/github.com/ric03uec/ot

ADD . $PROJECT_DIR

WORKDIR $PROJECT_DIR

RUN dep ensure
RUN go build main.go

ENTRYPOINT $PROJECT_DIR/main

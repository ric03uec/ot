FROM library/golang:1.11.2-alpine3.8 AS builder
MAINTAINER ric03uec <devashish@shippable.com>

RUN apk update && apk add --no-cache dep git

ENV GOPATH=/go
ENV PROJECT_DIR=$GOPATH/src/github.com/ric03uec/ot
RUN mkdir -p $PROJECT_DIR

COPY . $PROJECT_DIR
WORKDIR $PROJECT_DIR

RUN cd $PROJECT_DIR \
	&& dep ensure \
	&& go build -o /bin/cleanup_images main.go

FROM library/alpine:3.8
COPY --from=builder /bin/cleanup_images /bin/cleanup_images

ENTRYPOINT ["/bin/cleanup_images"]

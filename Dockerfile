FROM node:20.18.0-alpine3.20@sha256:d504f23acdda979406cf3bdbff0dff7933e5c4ec183dda404ed24286c6125e60
USER root

USER root
# Update packages as a result of Trivy security vulnerability checks
RUN apk update && apk upgrade --no-cache

# Setup nodejs group & nodejs user
RUN addgroup --system nodejs --gid 998 && \
    adduser --system nodejs --uid 999 --home /app/ && \
    chown -R 999:998 /app/

USER 999

WORKDIR /app

COPY --chown=999:998 . /app

RUN yarn install --frozen-lockfile --production --ignore-optional --ignore-scripts

HEALTHCHECK --interval=5m --timeout=3s \
 CMD curl --fail http://localhost:8080 || exit 1

CMD yarn start

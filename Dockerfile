FROM node:lts-alpine@sha256:807e66e2bee193961c9642bb1157d77a61747bf76737ca786da45b10749dcb42
USER root
# Update packages as a result of Anchore security vulnerability checks
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

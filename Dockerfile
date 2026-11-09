FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.2_3-alpine@sha256:ebf742568d6fa9505e5b8740dbb6bf7f4d38ea3a22fc2a940ee57cfa3a95a41e
USER root

# Setup nodejs group & nodejs user
RUN addgroup --system nodejs --gid 998 && \
    adduser --system nodejs --uid 999 --home /app/ && \
    chown -R 999:998 /app/

USER 999

WORKDIR /app

COPY --chown=999:998 . /app

RUN yarn install --frozen-lockfile --production --ignore-optional --ignore-scripts && \
    yarn cache clean

HEALTHCHECK --interval=5m --timeout=3s \
 CMD curl --fail http://localhost:8080 || exit 1

CMD yarn start

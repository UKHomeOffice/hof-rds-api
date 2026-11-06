FROM quay.io/ukhomeofficedigital/hof-nodejs:24.22.2_2-alpine@sha256:9279cf6e97dd0c1e0ea106153c2847a23a99bac3a588f7eb564d1f54eb3c92af
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

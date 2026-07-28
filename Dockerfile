FROM node:24.18.0-alpine3.24@sha256:4ba75f835bb8802193e4c114572113d4b26f95f6f094f4b5229d2a77773e0afc

USER root

# Update package index and upgrade all installed packages
RUN apk update && apk upgrade --no-cache

# Upgrade npm from the base image and patch vulnerable bundled dependencies
RUN npm install -g npm@latest && \
    npm explore -g npm -- npm install brace-expansion@5.0.8 tar@7.5.21 && \
    npm --version && \
    npm explore -g npm -- npm ls brace-expansion tar --depth=0

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

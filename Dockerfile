FROM node:24.19.0-alpine3.24@sha256:2a49bdf71e9fd965a58c1703fd9ddd205b34e5782b692a72dd1d248abb0beb43

USER root

# Update package index and upgrade all installed packages
RUN apk upgrade --no-cache

# Upgrade npm from the base image, then patch npm's bundled dependency tree
RUN npm install -g npm@12.0.2 && \
    npm pack brace-expansion@5.0.9 --pack-destination /tmp && \
    npm pack ip-address@10.3.1 --pack-destination /tmp && \
    rm -rf "$(npm root -g)/npm/node_modules/brace-expansion" && \
    mkdir -p "$(npm root -g)/npm/node_modules/brace-expansion" && \
    tar -xzf /tmp/brace-expansion-5.0.9.tgz -C "$(npm root -g)/npm/node_modules/brace-expansion" --strip-components=1 && \
    rm -rf "$(npm root -g)/npm/node_modules/ip-address" && \
    mkdir -p "$(npm root -g)/npm/node_modules/ip-address" && \
    tar -xzf /tmp/ip-address-10.3.1.tgz -C "$(npm root -g)/npm/node_modules/ip-address" --strip-components=1 && \
    rm /tmp/brace-expansion-5.0.9.tgz && \
    rm /tmp/ip-address-10.3.1.tgz && \
    npm --version && \
    node -p "require('$(npm root -g)/npm/node_modules/brace-expansion/package.json').version" && \
    node -p "require('$(npm root -g)/npm/node_modules/ip-address/package.json').version"

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

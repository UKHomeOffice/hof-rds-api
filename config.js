'use strict';

module.exports = {
  env: process.env.NODE_ENV,
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '100kb',
  port: process.env.PORT || 3000,
  requestTimeout: 1000,
  serviceName: process.env.SERVICE_NAME,
  latestMigration: process.env.LATEST_MIGRATION
};

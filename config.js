'use strict';

module.exports = {
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '100kb',
  port: process.env.PORT || 3000,
  requestTimeout: 1000,
  maxDataAge: process.env.MAX_DATA_AGE,
  serviceName: process.env.SERVICE_NAME
};

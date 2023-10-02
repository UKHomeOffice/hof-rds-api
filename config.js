'use strict';

module.exports = {
  env: process.env.NODE_ENV || 'local',
  bankHolidayApi: 'https://www.gov.uk/bank-holidays.json',
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '100kb',
  http_port: process.env.PORT || 3001,
  https_port: process.env.HTTPS_PORT,
  requestTimeout: +process.env.REQUEST_TIMEOUT || 1000,
  serviceName: process.env.SERVICE_NAME,
  latestMigration: process.env.LATEST_MIGRATION
};

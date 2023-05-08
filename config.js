'use strict';

module.exports = {
  env: process.env.NODE_ENV || 'local',
  bankHolidayApi: 'https://www.gov.uk/bank-holidays.json',
  maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '100kb',
  port: process.env.PORT || 3000,
  requestTimeout: 1000,
  serviceName: process.env.SERVICE_NAME,
  latestMigration: process.env.LATEST_MIGRATION
};

'use strict';

const config = require('./config');
const Router = require('./router');
const DB = require('./db').DatabaseManager;
const DataRetentionWindowCalculator = require('./lib/data_retention_window_calculator');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const json = require('morgan-json');
const cron = require('node-cron');

const format = json({
  short: ':method :url :status',
  length: ':res[content-length]',
  'response-time': ':response-time ms',
  timestamp: ':date[iso]'
});

const dbTablesConfig = require(`./services/${config.serviceName}/db_tables_config.json`);

const retentionCalculator = new DataRetentionWindowCalculator();
const db = new DB(config.serviceName, retentionCalculator, config.latestMigration);

const app = express();

app.use(bodyParser.json({ limit: config.maxPayloadSize }));
app.use(morgan(format));

const setupDB = async expressApp => {
  await db.migrate();

  dbTablesConfig.forEach(table => {
    return Router(expressApp, table);
  });

  await db.deleteOldTableData();
  await retentionCalculator.updateBankHolidaySheet();

  expressApp.listen(config.port);
};

setupDB(app);
// run once a day at midnight
cron.schedule('0 0 * * *', db.deleteOldTableData);
// run once on the 1st of every month
cron.schedule('0 0 1 * *', retentionCalculator.updateBankHolidaySheet);

module.exports = app;

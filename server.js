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
const fs = require('fs');
const http = require('http');
const https = require('https');

const format = json({
  short: ':method :url :status',
  length: ':res[content-length]',
  'response-time': ':response-time ms',
  timestamp: ':date[iso]'
});

const dbTablesConfig = require(`./services/${config.serviceName}/db_tables_config.json`);
console.log('1 ', config.serviceName);
const retentionCalculator = new DataRetentionWindowCalculator();
const db = new DB(config.serviceName, retentionCalculator, config.latestMigration);
console.log('2 ', config.serviceName);
const app = express();

app.use(bodyParser.json({ limit: config.maxPayloadSize }));
app.use(morgan(format));

const setupDB = async expressApp => {
  console.log('3 ', config.serviceName);
  await db.migrate();
  console.log('4 ', config.serviceName);
  dbTablesConfig.forEach(table => {
    return Router(expressApp, table);
  });

  await db.deleteOldTableData();
  await retentionCalculator.updateBankHolidaySheet();

  const httpServer = http.createServer(expressApp);

  httpServer.listen(config.http_port);

  if (config.https_port) {
    const privateKey  = fs.readFileSync('/certs/tls.key', 'utf8');
    const certificate = fs.readFileSync('/certs/tls.crt', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    const httpsServer = https.createServer(credentials, expressApp);
    httpsServer.listen(config.https_port);
  }
};

setupDB(app);
// run once a day at midnight
cron.schedule('0 0 * * *', db.deleteOldTableData);
// run once on the 1st of every month
cron.schedule('0 0 1 * *', retentionCalculator.updateBankHolidaySheet);

module.exports = app;

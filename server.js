'use strict';

const config = require('./config');
const Router = require('./router');
const db = require('./db');
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

const app = express();

app.use(bodyParser.json({ limit: config.maxPayloadSize }));
app.use(morgan(format));

const setupDB = async expressApp => {
  await db.migrate();

  dbTablesConfig.forEach(table => {
    return Router(expressApp, table);
  });

  await db.deleteOldTableData();

  expressApp.listen(config.port);
};

setupDB(app);

cron.schedule('0 0 * * *', async () => {
  db.deleteOldTableData();
});

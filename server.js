'use strict';

const config = require('./config');
const Controller = require('./controller');
const db = require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const json = require('morgan-json');

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
    return Controller(expressApp, table);
  });

  expressApp.listen(config.port);
};

setupDB(app);

// Update with your config settings.
const config = require('./config');
const { types } = require('pg');

// Return DATE columns as 'YYYY-MM-DD' strings rather than JS Dates to avoid timezone shifts
const PG_DATE_OID = 1082;
types.setTypeParser(PG_DATE_OID, value => value);

const testConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    database: 'test',
    user: 'postgres',
    password: 'postgres'
  }
};

const localConfig = {
  client: 'postgresql',
  connection: {
    database: config.serviceName,
    user: 'postgres',
    password: 'postgres'
  }
};

const remoteConfig = {
  client: 'pg',
  version: '8.7.1',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  }
};

const serviceConfig = {
  migrations: {
    tableName: 'knex_migrations',
    directory: __dirname + `/services/${config.serviceName}/migrations`
  },
  seeds: {
    directory: __dirname +  `/services/${config.serviceName}/seeds`
  }
};

const poolConfig = {
  pool: {
    min: 2,
    max: 10
  }
};

const setupConfig = conf => Object.assign({}, conf, serviceConfig, poolConfig);

module.exports = {
  test: setupConfig(testConfig),
  local: setupConfig(localConfig),
  development: setupConfig(remoteConfig),
  production: setupConfig(remoteConfig)
};

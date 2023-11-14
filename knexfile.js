// Update with your config settings.
const config = require('./config');

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
console.log(remoteConfig);

const serviceConfig = {
  migrations: {
    tableName: 'knex_migrations',
    directory: __dirname + `/services/${config.serviceName}/migrations`
  },
  seeds: {
    directory: __dirname + `/services/${config.serviceName}/seeds`
  }
};

const poolConfig = {
  pool: {
    min: 2,
    max: 100,
    acquireTimeoutMillis: 300000,
    createTimeoutMillis: 300000,
    destroyTimeoutMillis: 300000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 2000
  }
};

const setupConfig = conf => Object.assign({}, conf, serviceConfig, poolConfig);

module.exports = {
  test: setupConfig(testConfig),
  local: setupConfig(localConfig),
  development: setupConfig(remoteConfig),
  production: setupConfig(remoteConfig)
};

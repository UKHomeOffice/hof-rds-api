// Update with your config settings.

module.exports = {
  latestMigration: '20211115123602_resolver',
  development: {
    client: process.env.CLIENT || 'postgresql',
    connection: {
      database: 'knex_session',
      user: 'knex',
      password: 'knex'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  production: {
    client: 'pg',
    version: '8.7.1',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};

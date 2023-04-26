/* eslint-disable no-console */

const config = require('./config');
const knexFileLocation = `./services/${config.serviceName}/knexfile.js`;
const migrationsLocation = `./services/${config.serviceName}/migrations`;
const knexfile = require(knexFileLocation);
const knexMigrate = require('knex-migrate');
const knexfileConfig = knexfile[process.env.NODE_ENV ? 'production' : 'development'];
const knex = require('knex')(knexfileConfig);

const log = ({ action, migration }) =>
  console.log('Doing ' + action + ' on ' + migration);

async function migrate() {
  try {
    return await knexMigrate('up', {
      to: knexfile.latestMigration,
      knexfile: knexFileLocation,
      migrations: migrationsLocation
    }, log);
  } catch (e) {
    const migrationsAlreadyRun = e.message.includes('Migration is not pending');

    if (!migrationsAlreadyRun) {
      throw e;
    }
    return console.log('Migrations have already run!');
  }
}
// fallback if you need to kubectl exec into running Docker container
// and manually rollback a migration one at a time
async function rollback() {
  return await knexMigrate('down', {
    knexfile: knexFileLocation,
    migrations: migrationsLocation
  }, log);
}

async function deleteOldData(table) {
  return await knex.raw(`select * from ${table} where created_at < dateadd(day, -${config.maxDataAge}, getdate())`);
}

module.exports = {
  migrate,
  rollback,
  deleteOldData
};

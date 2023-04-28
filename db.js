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
  if (!config.latestMigration) {
    return console.log('No migration specified to upgrade to!');
  }
  try {
    return await knexMigrate('up', {
      to: config.latestMigration,
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

async function deleteOldTableData(table) {
  return await knex.raw(`select * from ${table} where created_at < current_date - interval '${config.maxDataAge}' day`);
}

async function resetTable(table) {
  return await knex(table).del();
}

module.exports = {
  migrate,
  rollback,
  deleteOldTableData,
  resetTable
};

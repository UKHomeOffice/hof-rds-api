
const config = require('./config');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const knexFileLocation = `./services/${config.serviceName}/knexfile.js`;
const migrationsLocation = `./services/${config.serviceName}/migrations`;
const tableData = require(`./services/${config.serviceName}/db_tables_config.json`);
const bankHolidays = require('./data/bank_holidays.json');
const knexfile = require(knexFileLocation);
const knexMigrate = require('knex-migrate');
const knexfileConfig = knexfile[process.env.NODE_ENV ? 'production' : 'development'];
const knex = require('knex')(knexfileConfig);
const logger = require('./lib/logger')({ env: config.env });

const log = ({ action, migration }) =>
  logger.log('info', 'Doing ' + action + ' on ' + migration);

const Sunday = 0;
const Saturday = 6;
const isWeekend = day => [Saturday, Sunday].includes(day);
const englandBankHolidays = _.get(bankHolidays, `['england-and-wales'].events`, []).map(o => o.date);
const isBankHoliday = date => englandBankHolidays.includes(date);

async function migrate() {
  if (!config.latestMigration) {
    return logger.log('info', 'No migration specified to upgrade to!');
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
    return logger.log('info', 'Migrations have already run!');
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

function deleteQueryBuilder(table, dataRetentionInDays, periodType) {
  // delete data older than max data age from start of today
  return `DELETE FROM ${table} WHERE created_at < '${startOfDataRetentionPeriod(periodType, dataRetentionInDays)}'`;
}

async function updateBankHolidaySheet() {
  try {
    const response = await axios.get(config.bankHolidayApi, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream('./data/bank_holidays.json'));
  } catch(e) {
    logger.log('error', e);
  }
}

function startOfDataRetentionPeriod(type, days) {
  let periodDays = days;
  const typeIsCalendarDays = type === 'calendar';
  const typeIsBusinessDays = type === 'business';
  const processingDate = moment();

  while (periodDays > 0) {
    processingDate.subtract(1, 'days');

    const dateAsString = processingDate.format('YYYY-MM-DD');
    const isBusinessDay = !isWeekend(processingDate.day()) && !isBankHoliday(dateAsString);

    if (typeIsCalendarDays || (typeIsBusinessDays && isBusinessDay)) {
      periodDays--;
    }
  }
  return processingDate.format('YYYY-MM-DD');
}

function deleteOldTableData() {
  const tablesToClear = tableData.map(table => {
    return new Promise((resolve, reject) => {
      if (table.dataRetentionInDays) {
        const periodType = table.dataRetentionPeriodType || 'calendar';

        logger.log('info', `cleaning up ${table.tableName} table data older than ${table.dataRetentionInDays} ${periodType} days...`);

        const query = deleteQueryBuilder(table.tableName, table.dataRetentionInDays, periodType);

        return knex.raw(query)
          .then(resolve)
          .catch(reject);
      }
      return resolve();
    });
  });

  return Promise.all(tablesToClear);
}

async function resetTable(table) {
  return await knex(table).del();
}

module.exports = {
  migrate,
  rollback,
  deleteOldTableData,
  startOfDataRetentionPeriod,
  updateBankHolidaySheet,
  resetTable
};

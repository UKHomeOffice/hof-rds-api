/* eslint-disable max-len */

const config = require('./config');
const moment = require('moment');
const knexMigrate = require('knex-migrate');
const knex = require('knex')(require('./knexfile')[config.env]);
const logger = require('./lib/logger')({ env: config.env });
const DataRetentionWindowCalculator = require('./lib/data_retention_window_calculator');

const log = ({ action, migration }) =>
  logger.log('info', 'Doing ' + action + ' on ' + migration);

exports.DatabaseManager = class DatabaseManager {
  constructor(serviceName, retentionCalculator, latestMigration) {
    this.knex = knex;
    this.serviceName = config.serviceName;
    this.retentionCalculator = retentionCalculator;
    this.tableData = require(`./services/${serviceName}/db_tables_config.json`);
    this.latestMigration = latestMigration;
  }

  deleteOldTableData() {
    let tablesToProcess = [];
    for (const table of this.tableData) {
      tablesToProcess.push(table);
      const { customCronJobs } = table;
      if (customCronJobs && Array.isArray(customCronJobs)) {
        tablesToProcess = [...tablesToProcess, ...customCronJobs];
      }
    }

    const tablesToClear = tablesToProcess.map(table => {
      return new Promise((resolve, reject) => {
        if (!table.dataRetentionInDays) {
          return resolve();
        }
        const {
          tableName,
          dataRetentionPeriodType,
          dataRetentionInDays,
          dataRetentionFilter,
          dataRetentionDateType
        } = table;

        return this.clearExpired(
          tableName,
          dataRetentionInDays,
          dataRetentionPeriodType,
          dataRetentionFilter,
          dataRetentionDateType
        )
          .then(resolve)
          .catch(reject);
      });
    });

    return Promise.all(tablesToClear);
  }

  async migrate() {
    try {
      return await knexMigrate('up', this.latestMigration ? { to: this.latestMigration } : {}, log);
    } catch (e) {
      const migrationsAlreadyRun = e.message.includes('Migration is not pending');

      if (!migrationsAlreadyRun) {
        throw e;
      }
      return logger.log('info', 'Migrations have already run!');
    }
  }

  async rollback() {
    return await knexMigrate('rollback', log);
  }

  async clearExpired(table, retentionInDays, periodType = 'calendar', retentionFilter = 'all', dateType = 'created_at') {
    logger.log('info', `Clearing ${retentionFilter} ${table} where ${dateType} is older than ${retentionInDays} ${periodType} days...`);

    const startDate = this.retentionCalculator.getRetentionStartDate(retentionInDays, periodType, moment());
    const query = this.#deleteQueryBuilder(table, dateType, startDate, retentionFilter);

    try {
      await this.knex.raw(query);
    } catch (error) {
      throw error;
    }
  }

  #deleteQueryBuilder(table, dateType, startDate, retentionFilter) {
    // delete data older than start of data retention window
    // eslint-disable-next-line max-len
    if (retentionFilter === 'unsubmitted') {
      return `DELETE from ${table} WHERE ${dateType} < '${startDate}' AND submitted_at IS NULL`;
    } else if (retentionFilter === 'submitted') {
      return `DELETE from ${table} WHERE ${dateType} < '${startDate}' AND submitted_at IS NOT NULL`;
    }
    return `DELETE FROM ${table} WHERE ${dateType} < '${startDate}'`;
  }
};

exports.migrate = async () => {
  const retentionCalculator = new DataRetentionWindowCalculator();
  const db = new exports.DatabaseManager(config.serviceName, retentionCalculator, config.latestMigration);
  await db.migrate();
};

exports.rollback = async () => {
  const retentionCalculator = new DataRetentionWindowCalculator();
  const db = new exports.DatabaseManager(config.serviceName, retentionCalculator, config.latestMigration);
  await db.rollback();
};

exports.clearExpired = async (table, retentionDays, periodType, retentionFilter, dateType) => {
  try {
    const retentionCalculator = new DataRetentionWindowCalculator();
    const db = new exports.DatabaseManager(config.serviceName, retentionCalculator, config.latestMigration);
    await db.clearExpired(table, retentionDays, periodType, retentionFilter, dateType);
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

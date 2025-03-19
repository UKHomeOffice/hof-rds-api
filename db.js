
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
    const tablesToClear = this.tableData.map(table => {
      return new Promise((resolve, reject) => {
        if (!table.dataRetentionInDays) {
          return resolve();
        }
        const { tableName, dataRetentionPeriodType, dataRetentionInDays } = table;
        // eslint-disable-next-line
        return this.clearExpired(tableName, dateType = 'created_at', dataRetentionInDays, dataRetentionPeriodType)
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

  clearExpired(table, dateType, retentionInDays, periodType = 'calendar') {
    // eslint-disable-next-line max-len
    logger.log('info', `deleting ${table} rows where ${dateType} is older than ${retentionInDays} ${periodType} days...`);

    const startDate = this.retentionCalculator.getRetentionStartDate(retentionInDays, periodType, moment());
    const query = this.#deleteQueryBuilder(table, dateType, startDate);

    return this.knex.raw(query);
  }

  #deleteQueryBuilder(table, dateType, startDate) {
    // delete data older than start of data retention window
    // eslint-disable-next-line max-len
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

exports.clearExpired = async (table, dateColumn, retentionDays, periodType) => {
  try {
    const retentionCalculator = new DataRetentionWindowCalculator();
    const db = new exports.DatabaseManager(config.serviceName, retentionCalculator, config.latestMigration);
    await db.clearExpired(table, dateColumn, retentionDays, periodType);
  } catch (error) {
    logger.error(error.message);
  }
};

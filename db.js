
const config = require('./config');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const knexMigrate = require('knex-migrate');
const knex = require('knex')(require('./knexfile')[config.env]);
const logger = require('./lib/logger')({ env: config.env });

const Sunday = 0;
const Saturday = 6;
const BANK_HOLIDAYS_DATA_PATH = './data/bank_holidays.json';
const BANK_HOLIDAYS_COUNTRY = 'england-and-wales';
const DATE_FORMAT = 'YYYY-MM-DD';

const log = ({ action, migration }) =>
  logger.log('info', 'Doing ' + action + ' on ' + migration);

exports.DatabaseManager = class DatabaseManager {
  constructor(conf) {
    this.knex = knex;
    this.bankHolidayApi = conf.bankHolidayApi;
    this.tableData = require(`./services/${conf.serviceName}/db_tables_config.json`);
    this.latestMigration = conf.latestMigration;
  }

  deleteOldTableData() {
    const tablesToClear = this.tableData.map(table => {
      return new Promise((resolve, reject) => {
        if (!table.dataRetentionInDays) {
          return resolve();
        }
        return this.#clearTable(table).then(resolve).catch(reject);
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

  async updateBankHolidaySheet() {
    try {
      const response = await axios.get(this.bankHolidayApi, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(BANK_HOLIDAYS_DATA_PATH));
    } catch(e) {
      logger.log('error', e);
    }
  }

  getExpiryDate(date, periodType, dataRetentionInDays) {
    return this.#dataRetentionEndDate(moment(date), periodType, dataRetentionInDays);
  }

  // private
  #clearTable(table) {
    const periodType = table.dataRetentionPeriodType || 'calendar';
    // eslint-disable-next-line max-len
    logger.log('info', `cleaning up ${table.tableName} table data older than ${table.dataRetentionInDays} ${periodType} days...`);

    const query = this.#deleteQueryBuilder(table.tableName, table.dataRetentionInDays, periodType);

    return this.knex.raw(query);
  }

  #deleteQueryBuilder(table, dataRetentionInDays, periodType) {
    // delete data older than max data age from start of today
    // eslint-disable-next-line max-len
    const dataRetentionStartDate = this.#dataRetentionStartDate(moment(), periodType, dataRetentionInDays);
    return `DELETE FROM ${table} WHERE created_at < '${dataRetentionStartDate}'`;
  }

  #formatDate(date) {
    return date.format(DATE_FORMAT);
  }

  #dataRetentionStartDate(fromDate, type, days) {
    return this.#calculateDataRetention('end', fromDate, type, days);
  }

  #dataRetentionEndDate(fromDate, type, days) {
    return this.#calculateDataRetention('start', fromDate, type, days);
  }

  #calculateDataRetention(from, fromDate, type, days) {
    let periodDays = days;
    const fromPeriodStart = from === 'start';
    const typeIsCalendarDays = type === 'calendar' || !type;
    const typeIsBusinessDays = type === 'business';
    const processingDate = fromDate;

    while (periodDays > 0) {
      fromPeriodStart ? processingDate.add(1, 'days') : processingDate.subtract(1, 'days');

      const dateAsString = this.#formatDate(processingDate);
      const isBusinessDay = !this.#isWeekend(processingDate.day()) && !this.#isBankHoliday(dateAsString);

      if (typeIsCalendarDays || (typeIsBusinessDays && isBusinessDay)) {
        periodDays--;
      }
    }
    return this.#formatDate(processingDate);
  }

  #isWeekend(day) {
    return [Saturday, Sunday].includes(day);
  }

  #isBankHoliday(date) {
    const bankHolidays = require(BANK_HOLIDAYS_DATA_PATH);
    const englandBankHolidays = _.get(bankHolidays, `['${BANK_HOLIDAYS_COUNTRY}'].events`, []).map(o => o.date);
    return englandBankHolidays.includes(date);
  }
};

exports.migrate = async () => {
  const db = new exports.DatabaseManager(config);
  await db.migrate();
};

exports.rollback = async () => {
  const db = new exports.DatabaseManager(config);
  await db.rollback();
};

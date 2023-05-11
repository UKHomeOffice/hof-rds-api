'use strict';

const config = require('../config');
const moment = require('moment');
const fs = require('fs');
const axios = require('axios');
const _ = require('lodash');
const path = require('path');
const logger = require('./logger')({ env: config.env });

const Sunday = 0;
const Saturday = 6;
const BANK_HOLIDAYS_DATA_PATH = path.join(__dirname + '/../data/bank_holidays.json');
const BANK_HOLIDAYS_COUNTRY = 'england-and-wales';
const DATE_FORMAT = 'YYYY-MM-DD';

module.exports = class DataRetentionWindowCalculator {
  getRetentionStartDate(dataRetentionInDays, periodType, date) {
    return this.#calculateDataRetention('start', dataRetentionInDays, periodType, moment(date));
  }

  getRetentionEndDate(dataRetentionInDays, periodType, date) {
    return this.#calculateDataRetention('end', dataRetentionInDays, periodType, moment(date));
  }

  async updateBankHolidaySheet() {
    try {
      const response = await axios.get(config.bankHolidayApi, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(BANK_HOLIDAYS_DATA_PATH));
    } catch(e) {
      logger.log('error', e);
    }
  }

  // private
  #formatDate(date) {
    return date.format(DATE_FORMAT);
  }

  #calculateDataRetention(to, days, type, fromDate) {
    let periodDays = days;
    const calculateToPeriodEnd = to === 'end';
    const typeIsCalendarDays = type === 'calendar' || !type;
    const typeIsBusinessDays = type === 'business';
    const processingDate = fromDate;

    while (periodDays > 0) {
      calculateToPeriodEnd ? processingDate.add(1, 'days') : processingDate.subtract(1, 'days');

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

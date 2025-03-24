const config = require('../config');
const logger = require('./logger')({ env: config.env });
const cron = require('node-cron');

/**
 * Schedules cron jobs for tables based on their customCronJobs configuration.
 */
const scheduleCustomCronJobs = (table, db) => {
  if (table.customCronJobs && Array.isArray(table.customCronJobs)) {
    const tableName = table.tableName;
    table.customCronJobs.forEach(job => {
      const {
        cronExpression,
        dataRetentionPeriodType,
        dataRetentionInDays,
        dataRetentionFilter,
        dataRetentionDateType
      } = job;

      // Validate required fields
      if (!tableName || !dataRetentionPeriodType || !dataRetentionInDays || !cronExpression) {
        logger.error(`Invalid customCronJobs configuration for table: ${tableName}`);
        return;
      }
      // Schedule the cron job (e.g., run once a day at midnight)
      cron.schedule(cronExpression, () => {
        try {
          db.clearExpired(
            tableName,
            dataRetentionInDays,
            dataRetentionPeriodType,
            dataRetentionFilter,
            dataRetentionDateType
          );
        } catch (error) {
          logger.error(`Scheduled custom cron job failed: ${error.message}`);
        }
      });

      logger.log(
        'info',
        // eslint-disable-next-line max-len
        `Scheduled custom cron job for table "${tableName}" with retention period of ${dataRetentionInDays} ${dataRetentionPeriodType} days and filter "${dataRetentionFilter || 'all'}".`
      );
    });
  }
};

module.exports = { scheduleCustomCronJobs };

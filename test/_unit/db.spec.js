'use strict';

const moment = require('moment');
const DataRetentionWindowCalculator = require('../../lib/data_retention_window_calculator');
const knexfileConfig = require('../../knexfile').test;

const retentionCalculator = new DataRetentionWindowCalculator();

const testConfig = {
  env: 'test',
  bankHolidayApi: 'https://www.gov.uk/bank-holidays.json',
  serviceName: 'asc'
};

describe('Database Manager', () => {
  let DB;
  let db;
  let knexMigrateStub;
  let knexRawQueryStub;

  beforeEach(async () => {
    knexMigrateStub = sinon.stub();
    knexRawQueryStub = sinon.stub();

    knexRawQueryStub.resolves('Deleted!');

    DB = proxyquire('../db', {
      './config': testConfig,
      // allows tests to override the time now whilst still using the full moment api
      moment: () => moment('2023-05-09'),
      // knex tested in integrations tests so stubbing here for args and data deletion logic checks
      'knex-migrate': knexMigrateStub,
      knex: sinon.stub().withArgs(knexfileConfig).returns({ raw: knexRawQueryStub }),
      './services/asc/db_tables_config.json': [
        {
          tableName: 'saved_applications',
          dataRetentionPeriodType: 'business',
          dataRetentionInDays: '7'
        },
        {
          tableName: 'recruiters'
        }
      ]
    }).DatabaseManager;

    db = new DB('asc', retentionCalculator);
  });

  afterEach(async () => {
    knexMigrateStub.reset();
    knexRawQueryStub.reset();
  });

  describe('#migrate', () => {
    it('runs all migrations when latestMigration is not set', async () => {
      await db.migrate();
      knexMigrateStub.should.have.been.calledOnce.calledWith('up', {});
    });

    it('runs migrations up to latestMigration if it is set', async () => {
      db = new DB('asc', retentionCalculator, 'test_migration');
      await db.migrate();
      knexMigrateStub.should.have.been.calledOnce.calledWith('up', { to: 'test_migration' });
    });
  });

  describe('#rollback', () => {
    it('rolls back the most recent batch of migrations', async () => {
      await db.rollback();
      knexMigrateStub.should.have.been.calledOnce.calledWith('rollback');
    });
  });

  describe('#deleteOldTableData', () => {
    it('calls knex only if dataRetentionInDays has been set in the table data', async () => {
      await db.deleteOldTableData();
      knexRawQueryStub.should.have.been
        .calledOnce.calledWithExactly("DELETE FROM saved_applications WHERE created_at < '2023-04-26'");
    });

    it('deletes data using a dynamic data rentention window based on business days', async () => {
      DB = proxyquire('../db', {
        moment: () => moment('2023-05-09'),
        knex: sinon.stub().withArgs(knexfileConfig).returns({ raw: knexRawQueryStub }),
        './services/asc/db_tables_config.json': [
          {
            tableName: 'saved_applications',
            dataRetentionPeriodType: 'business',
            dataRetentionInDays: '14'
          }
        ]
      }).DatabaseManager;

      db = new DB('asc', retentionCalculator);

      await db.deleteOldTableData();
      knexRawQueryStub.should.have.been
        .calledOnce.calledWithExactly("DELETE FROM saved_applications WHERE created_at < '2023-04-17'");
    });

    it('deletes data using a dynamic data rentention window based on calendar days', async () => {
      DB = proxyquire('../db', {
        moment: () => moment('2023-05-09'),
        knex: sinon.stub().withArgs(knexfileConfig).returns({ raw: knexRawQueryStub }),
        './services/asc/db_tables_config.json': [
          {
            tableName: 'saved_applications',
            dataRetentionPeriodType: 'calendar',
            dataRetentionInDays: '14'
          }
        ]
      }).DatabaseManager;

      db = new DB('asc', retentionCalculator);

      await db.deleteOldTableData();
      knexRawQueryStub.should.have.been
        .calledOnce.calledWithExactly("DELETE FROM saved_applications WHERE created_at < '2023-04-25'");
    });

    it('deletes data based on calendar days if data retention period type is not set', async () => {
      DB = proxyquire('../db', {
        moment: () => moment('2023-05-09'),
        knex: sinon.stub().withArgs(knexfileConfig).returns({ raw: knexRawQueryStub }),
        './services/asc/db_tables_config.json': [
          {
            tableName: 'saved_applications',
            dataRetentionInDays: '14'
          }
        ]
      }).DatabaseManager;

      db = new DB('asc', retentionCalculator);

      await db.deleteOldTableData();
      knexRawQueryStub.should.have.been
        .calledOnce.calledWithExactly("DELETE FROM saved_applications WHERE created_at < '2023-04-25'");
    });
  });
});

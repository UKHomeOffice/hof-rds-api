'use strict';

process.env.SERVICE_NAME = 'asc';

const DataRetentionWindowCalculator = require('../../lib/data_retention_window_calculator');
const DB = require('../../db').DatabaseManager;

describe('ASC service - Cron deletion windows', () => {
  let db;
  const retentionCalculator = new DataRetentionWindowCalculator();

  beforeEach(async () => {
    db = new DB('asc', retentionCalculator);
    await db.rollback();
    await db.migrate();
    await db.knex.seed.run();
  });

  afterEach(async () => {
    await db.rollback();
  });

  it('should delete only unsubmitted records older than 5 business days (created_at)', async () => {
    const threshold = retentionCalculator.getRetentionStartDate(
      '5',
      'business'
    );

    const oldDate = db.knex.raw(`TIMESTAMP '${threshold}' - INTERVAL '1 day'`);
    const newDate = db.knex.raw(`TIMESTAMP '${threshold}' + INTERVAL '1 day'`);

    // Insert two unsubmitted records: one older than threshold, one newer
    await db.knex('saved_applications').insert([
      {
        applicant_id: 'D001',
        recruiter_id: 1,
        email: 'del30@example.com',
        session: '{}',
        created_at: oldDate,
        updated_at: oldDate,
        submitted_at: null
      },
      {
        applicant_id: 'K001',
        recruiter_id: 1,
        email: 'keep30@example.com',
        session: '{}',
        created_at: newDate,
        updated_at: newDate,
        submitted_at: null
      }
    ]);

    await db.deleteOldTableData();

    const delRow = await db
      .knex('saved_applications')
      .where({ applicant_id: 'D001' });
    const keepRow = await db
      .knex('saved_applications')
      .where({ applicant_id: 'K001' });

    expect(delRow.length).to.eql(0);
    expect(keepRow.length).to.eql(1);
  });

  it('should delete only submitted records older than 30 business days (submitted_at)', async () => {
    const threshold = retentionCalculator.getRetentionStartDate(
      '30',
      'business'
    );

    const oldDate = db.knex.raw(`TIMESTAMP '${threshold}' - INTERVAL '1 day'`);
    const newDate = db.knex.raw(`TIMESTAMP '${threshold}' + INTERVAL '1 day'`);

    await db.knex('saved_applications').insert([
      {
        applicant_id: 'D005',
        recruiter_id: 1,
        email: 'del5@example.com',
        session: '{}',
        created_at: newDate, // creation irrelevant for submitted rule
        updated_at: newDate,
        submitted_at: oldDate
      },
      {
        applicant_id: 'K005',
        recruiter_id: 1,
        email: 'keep5@example.com',
        session: '{}',
        created_at: oldDate,
        updated_at: oldDate,
        submitted_at: newDate
      }
    ]);

    await db.deleteOldTableData();

    const delRow = await db
      .knex('saved_applications')
      .where({ applicant_id: 'D005' });
    const keepRow = await db
      .knex('saved_applications')
      .where({ applicant_id: 'K005' });

    expect(delRow.length).to.eql(0);
    expect(keepRow.length).to.eql(1);
  });
});

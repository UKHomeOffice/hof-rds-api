'use strict';

const path = require('path');
const knexfile = require('../../knexfile');

const knex = require('knex')({
  ...knexfile.test,
  migrations: {
    tableName: 'saa_knex_migrations',
    directory: path.join(__dirname, '../../services/saa/migrations')
  }
});

const application = (overrides = {}) => ({
  uan: '1234567812345678',
  date_of_birth: '1990-01-01',
  email: 'draft@example.com',
  session: '{}',
  ...overrides
});

const expectUniqueViolation = async insert => {
  try {
    await insert;
  } catch (error) {
    expect(error.code).to.equal('23505');
    expect(error.constraint).to.equal(
      'applications_uan_date_of_birth_draft_unique'
    );
    return;
  }
  throw new Error('Expected insert to fail with a unique violation');
};

describe('SAA service - applications draft uniqueness', () => {
  beforeEach(async () => {
    await knex.migrate.rollback(undefined, true);
    await knex.migrate.latest();
  });

  afterEach(async () => {
    await knex.migrate.rollback(undefined, true);
  });

  after(async () => {
    await knex.schema.dropTableIfExists('saa_knex_migrations');
    await knex.schema.dropTableIfExists('saa_knex_migrations_lock');
    await knex.destroy();
  });

  it('rejects a second draft with the same UAN and date of birth', async () => {
    await knex('applications').insert(application());

    await expectUniqueViolation(
      knex('applications').insert(application({ email: 'other@example.com' }))
    );
  });

  it('allows drafts with the same UAN but a different date of birth', async () => {
    await knex('applications').insert(application());
    await knex('applications').insert(
      application({ date_of_birth: '1985-06-15' })
    );

    const rows = await knex('applications').where({ uan: '1234567812345678' });
    expect(rows).to.have.length(2);
  });

  it('allows a new draft once the existing one has been submitted', async () => {
    const [{ id }] = await knex('applications')
      .insert(application())
      .returning('id');
    await knex('applications')
      .where({ id })
      .update({ submitted_at: knex.fn.now() });

    await knex('applications').insert(application());

    const rows = await knex('applications')
      .where({ uan: '1234567812345678', date_of_birth: '1990-01-01' })
      .orderBy('id');
    expect(rows).to.have.length(2);
    expect(rows[0].submitted_at).to.not.equal(null);
    expect(rows[1].submitted_at).to.equal(null);
  });

  it('still rejects a second draft when a submitted application also exists', async () => {
    await knex('applications').insert(
      application({ submitted_at: knex.fn.now() })
    );
    await knex('applications').insert(application());

    await expectUniqueViolation(knex('applications').insert(application()));
  });
});

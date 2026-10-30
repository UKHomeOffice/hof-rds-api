exports.up = async function (knex) {
  await knex.schema.createTable('applications', table => {
    table.increments();
    // UAN is cleansed to digits only before storing; formatted as xxxx-xxxx-xxxx-xxxx for display
    table.string('uan', 16).notNullable();
    table.date('date_of_birth').notNullable();
    table.string('email').notNullable();
    table.json('session').notNullable();
    table.string('submission_reference');
    table.timestamps(true, true);
    table.timestamp('submitted_at');
    table.index('uan');
    table.index('email');
    // Only one draft per UAN + DOB; submitted applications don't block a new one
    table.unique(['uan', 'date_of_birth'], {
      indexName: 'applications_uan_date_of_birth_draft_unique',
      predicate: knex.whereNull('submitted_at')
    });
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('applications');
};

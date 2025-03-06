
exports.up = function(knex) {
  return knex.schema.createTable('applications', table => {
    table.increments();
    table.integer('applicant_id').unsigned().notNullable().references('applicant_id').inTable('applicants');
    table.string('licence_type').notNullable();
    table.json('session').notNullable();
    table.integer('status_id').unsigned().notNullable().references('status_id').inTable('application_status');
    table.timestamps(true, true);
    table.timestamp('submitted_at');
    table.integer('icasework_case_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};

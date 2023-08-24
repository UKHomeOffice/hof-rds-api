
exports.up = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.string('job_role').defaultTo(null);
    table.string('applicant_id').defaultTo(null).alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.dropColumn('job_role');
  });
};

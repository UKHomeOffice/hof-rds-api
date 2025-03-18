
exports.up = function(knex) {
  return knex.schema.createTable('applicants', table => {
    table.increments('applicant_id');
    table.string('username').unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applicants');
};

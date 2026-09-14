
exports.up = function(knex) {
  return knex.schema.createTable('submitted_applications', table => {
    table.increments();
    table.string('submission_reference').notNullable();
    table.json('session').notNullable();
    table.timestamps(true, true);
    table.timestamp('submitted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('submitted_applications');
};

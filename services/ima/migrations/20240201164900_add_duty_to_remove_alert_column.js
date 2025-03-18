
exports.up = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.string('duty_to_remove_alert').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.dropColumn('duty_to_remove_alert');
  });
};


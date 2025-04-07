exports.up = function(knex) {
  return knex.schema.createTable('application_status', table => {
    table.increments('status_id');
    table.string('status_name').unique().notNullable();
    table.string('description');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('application_status');
};

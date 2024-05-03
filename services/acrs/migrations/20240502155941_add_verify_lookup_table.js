
exports.up = function(knex) {
  return knex.schema.createTable('verify_lookup', table => {
    table.string('date_of_birth').notNullable();
    table.string('brp');
    table.string('uan');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('verify_lookup');
};

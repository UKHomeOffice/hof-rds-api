
exports.up = function(knex) {
  return knex.schema.createTable('verify_lookup', table => {
    table.string('date_of_birth').notNullable();
    table.string('brp').notNullable();
    table.string('uan').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('verify_lookup');
};

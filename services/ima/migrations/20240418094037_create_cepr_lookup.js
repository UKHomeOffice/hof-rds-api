
exports.up = function(knex) {
  return knex.schema.createTable('cepr_lookup', table => {
    table.string('cepr').primary();
    table.string('dob').notNullable();
    table.string('dtr').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cepr_lookup');
};

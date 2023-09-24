
exports.up = function(knex) {
  return knex.schema.createTable('caseworkers', table => {
    table.increments();
    table.string('email').unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('caseworkers');
};

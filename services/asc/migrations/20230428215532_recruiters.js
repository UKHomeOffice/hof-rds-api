
exports.up = function(knex) {
  return knex.schema.createTable('recruiters', table => {
    table.increments();
    table.string('email').unique().notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('recruiters');
};

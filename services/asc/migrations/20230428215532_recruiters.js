
exports.up = function(knex) {
  return knex.schema.createTable('recruiters', table => {
    table.increments();
    table.string('email').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('recruiters');
};

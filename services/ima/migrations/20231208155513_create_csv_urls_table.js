
exports.up = function(knex) {
  return knex.schema.createTable('csv_urls', table => {
    table.increments();
    table.string('url').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('csv_urls');
};

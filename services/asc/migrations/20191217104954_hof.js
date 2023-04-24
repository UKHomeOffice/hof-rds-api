exports.up = function (knex) {
  return knex.schema.createTable('hof', table => {
    table.increments();
    table.string('type').notNullable();
    table.string('ip').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('hof');
};

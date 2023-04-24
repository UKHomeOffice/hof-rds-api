
exports.up = function (knex) {
  return knex.schema.table('hof', table => {
    table.boolean('success').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('hof', table => {
    table.dropColumn('success');
  });
};

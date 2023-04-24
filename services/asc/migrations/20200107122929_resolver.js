
exports.up = function (knex) {
  return knex.schema.table('resolver', table => {
    table.boolean('success').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('resolver', table => {
    table.dropColumn('success');
  });
};

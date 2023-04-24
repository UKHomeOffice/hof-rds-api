
exports.up = function (knex) {
  return knex.schema.table('resolver', table => {
    table.string('externalID');
  });
};

exports.down = function (knex) {
  return knex.schema.table('resolver', table => {
    table.dropColumn('externalID');
  });
};

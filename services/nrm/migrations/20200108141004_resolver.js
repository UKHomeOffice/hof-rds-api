
exports.up = function (knex) {
  return knex.schema.table('resolver', table => {
    table.string('caseID');
  });
};

exports.down = function (knex) {
  return knex.schema.table('resolver', table => {
    table.dropColumn('caseID');
  });
};

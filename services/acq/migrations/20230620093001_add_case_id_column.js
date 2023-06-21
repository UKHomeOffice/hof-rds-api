
exports.up = function(knex) {
  return knex.schema.table('reports', table => {
    table.string('case_id').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table('reports', table => {
    table.dropColumn('case_id');
  });
};

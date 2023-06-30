
exports.up = function(knex) {
  return knex.schema.table('sap_reports', table => {
    table.timestamp('submitted_at').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table('sap_reports', table => {
    table.dropColumn('submitted_at');
  });
};


exports.up = function(knex) {
  return knex.schema.table('sap_reports', table => {
    table.string('case_id').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table('sap_reports', table => {
    table.dropColumn('case_id');
  });
};

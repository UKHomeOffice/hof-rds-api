
exports.up = function(knex) {
  const migrateCaseIdData = () => {
    return knex('sap_reports').update({
      case_id: knex.raw("session::json ->> 'case-id'")
    }).timeout(240000);
  };

  return knex.schema.table('sap_reports', table => {
    return migrateCaseIdData().then(() => {
      table.string('case_id').notNullable().alter();
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('sap_reports', table => {
    table.dropColumn('case_id').nullable().alter();
  });
};

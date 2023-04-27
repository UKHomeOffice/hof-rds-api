exports.up = function (knex) {
  // create user for reports table
  return knex
    .raw(`
          CREATE USER saved_applications WITH PASSWORD '${process.env.REPORTS_USER_PASS}';
          GRANT INSERT ON saved_applications TO saved_applications;
          GRANT ALL ON SEQUENCE saved_applications_id_seq to saved_applications;
          GRANT SELECT ON saved_applications TO grafana;
      `);
};

exports.down = function (knex) {
  return knex
    .raw(`
          DROP OWNED BY saved_applications;
          DROP USER saved_applications;
      `);
};

exports.up = function (knex) {
  // create user for reports table
  return knex
    .raw(`
          CREATE USER reports WITH PASSWORD '${process.env.REPORTS_USER_PASS}';
          GRANT INSERT ON reports TO reports;
          GRANT ALL ON SEQUENCE reports_id_seq to reports;
          GRANT SELECT ON reports TO grafana;
      `);
};

exports.down = function (knex) {
  return knex
    .raw(`
          DROP OWNED BY reports;
          DROP USER reports;
      `);
};

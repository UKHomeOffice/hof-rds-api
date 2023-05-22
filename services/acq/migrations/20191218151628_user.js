exports.up = function (knex) {
  // create user for hof table
  // create user for resolver table
  // create user for reports table
  // create read user for graphana
  return knex
    .raw(`
            CREATE USER hof WITH PASSWORD '${process.env.HOF_USER_PASS}';
            GRANT INSERT ON hof TO hof;
            GRANT ALL ON SEQUENCE hof_id_seq to hof;
            CREATE USER resolver WITH PASSWORD '${process.env.RESOLVER_USER_PASS}';
            GRANT INSERT ON resolver TO resolver;
            GRANT ALL ON SEQUENCE resolver_id_seq to resolver;
            CREATE USER grafana WITH PASSWORD '${process.env.GRAFANA_USER_PASS}';
            GRANT SELECT ON resolver, hof TO grafana;
        `);
};

exports.down = function (knex) {
  return knex
    .raw(`
            REVOKE SELECT ON resolver, hof FROM grafana;
            DROP USER grafana;
            REVOKE ALL ON SEQUENCE resolver_id_seq FROM resolver;
            REVOKE INSERT ON resolver FROM resolver;
            DROP USER resolver;
            REVOKE ALL ON SEQUENCE hof_id_seq FROM hof;
            REVOKE INSERT ON hof FROM hof;
            DROP USER hof;
        `);
};

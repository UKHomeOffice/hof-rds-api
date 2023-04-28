
exports.up = function(knex) {
  return knex
    .raw(`
            CREATE USER hof WITH PASSWORD '${process.env.HOF_USER_PASS}';
            GRANT INSERT ON recruiters TO hof;
            GRANT ALL ON SEQUENCE recruiters_id_seq to hof;
            GRANT INSERT ON saved_applications TO hof;
            GRANT ALL ON SEQUENCE saved_applications_id_seq to hof;
        `);
};

exports.down = function(knex) {
  return knex
    .raw(`
            REVOKE ALL ON SEQUENCE saved_applications_id_seq FROM hof;
            REVOKE INSERT ON saved_applications FROM hof;
            REVOKE ALL ON SEQUENCE recruiters_id_seq FROM hof;
            REVOKE INSERT ON recruiters FROM hof;
            DROP USER hof;
        `);
};

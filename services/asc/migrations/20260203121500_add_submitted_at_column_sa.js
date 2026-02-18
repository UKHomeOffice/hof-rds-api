exports.up = function(knex) {
  return knex.schema.hasColumn('saved_applications', 'submitted_at')
      .then(exists => {
        if (!exists) {
          return knex.schema.table('saved_applications', table => {
            table.timestamp('submitted_at').nullable();
          });
        }
      });
};

exports.down = function(knex) {
  return knex.schema.hasColumn('saved_applications', 'submitted_at')
      .then(exists => {
        if (exists) {
          return knex.schema.table('saved_applications', table => {
            table.dropColumn('submitted_at');
          });
        }
      });
};

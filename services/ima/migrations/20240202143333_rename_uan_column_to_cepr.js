
exports.up = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.renameColumn('uan', 'CEPR');
  });
};

exports.down = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.renameColumn('CEPR', 'uan');
  });
};

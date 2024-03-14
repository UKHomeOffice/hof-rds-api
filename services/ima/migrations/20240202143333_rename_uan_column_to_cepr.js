
exports.up = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.renameColumn('uan', 'cepr');
  });
};

exports.down = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.renameColumn('cepr', 'uan');
  });
};



exports.up = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.integer('caseworker_id').unsigned().notNullable().references('id').inTable('caseworkers');
  });
};

exports.down = function(knex) {
  return knex.schema.table('saved_applications', table => {
    table.dropColumn('caseworker_id');
  });
};

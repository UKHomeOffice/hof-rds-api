
exports.up = function (knex) {
  return knex.schema.createTable('duplicates', table => {
    table.increments();
    table.timestamps(true, true);
    table.string('caseID');
    table.string('externalID').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('duplicates');
};


exports.up = function(knex) {
  return knex.schema.createTable('saved_applications', table => {
    table.increments();
    table.integer('recruiter_id').unsigned().notNullable().references('id').inTable('recruiters');
    table.string('email').notNullable();
    table.json('session').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('saved_applications');
};

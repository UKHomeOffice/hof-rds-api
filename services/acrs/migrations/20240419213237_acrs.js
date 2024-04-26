
exports.up = function(knex) {
    return knex.schema.createTable('saved_applications', table => {
        table.increments();
        table.string('brp').defaultTo(null);
        table.string('uan').defaultTo(null);
        table.string('email');
        table.string('date_of_birth').notNullable();
        table.json('session').notNullable();
        table.timestamps(true, true);
        table.timestamp('submitted_at');
      });
};

exports.down = function(knex) {
    return knex.schema.createTable('saved_applications');
};


exports.up = function(knex) {
    return knex.schema.createTable('saved_applications', table => {
        table.increments();
        table.string('uan').notNullable();
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

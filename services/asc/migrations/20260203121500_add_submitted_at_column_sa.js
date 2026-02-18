exports.up = function(knex) {
    return knex.schema.table('saved_applications', table => {
        table.timestamp('submitted_at').defaultTo(null);
    });
};

exports.down = function(knex) {
    return knex.schema.table('saved_applications', table => {
        table.dropColumn('submitted_at');
    });
};

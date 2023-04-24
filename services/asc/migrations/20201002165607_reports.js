'use strict';

// eslint-disable-next-line func-names
exports.up = function (knex) {
  return knex.schema.createTable('reports', table => {
    table.increments();
    table.string('email').notNullable();
    table.json('session').notNullable();
    table.timestamps(true, true);
  });
};

// eslint-disable-next-line func-names
exports.down = function (knex) {
  return knex.schema.dropTable('reports');
};

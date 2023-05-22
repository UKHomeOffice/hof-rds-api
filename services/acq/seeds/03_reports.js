'use strict';

// eslint-disable-next-line func-names
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('reports').del()
    // eslint-disable-next-line func-names
    .then(function () {
      // Inserts seed entries
      return knex('reports').insert([
        {email: 'dev@testing.com', session: '{ "my":"json"}'},
        {email: 'dev@test.com', session: '{ "my":"json"}'}
      ]);
    });
};

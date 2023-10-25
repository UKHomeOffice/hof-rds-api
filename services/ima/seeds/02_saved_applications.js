'use strict';

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('saved_applications').insert([
    {
      uan: '1234-5678-1234-5678',
      date_of_birth: '2000-01-01',
      email: 'test@hotmail.com',
      caseworker_id: 1,
      session: '{ "my":"json"}'
    },
    {
      uan: '5678-1234-5678-1234',
      date_of_birth: '2000-01-01',
      email: 'test2@hotmail.com',
      caseworker_id: 2,
      session: '{ "my":"json2"}'
    },
    {
      uan: '3456-7890-3456-7890',
      date_of_birth: '2000-01-01',
      email: 'test2@hotmail.com',
      caseworker_id: 3,
      session: '{ "my":"json3"}'
    },
    {
      uan: '2345-6789-2345-6789',
      date_of_birth: '2000-01-01',
      email: 'test4@hotmail.com',
      caseworker_id: 4,
      session: '{ "my":"json4"}'
    }
  ]);
};

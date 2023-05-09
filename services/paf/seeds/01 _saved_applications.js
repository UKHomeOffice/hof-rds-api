'use strict';

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('saved_applications').insert([
    {
      applicant_id: '0000001',
      recruiter_id: 1,
      email: 'test@hotmail.com',
      session: '{ "my":"json"}'
    },
    {
      applicant_id: '0000002',
      recruiter_id: 2,
      email: 'test2@hotmail.com',
      session: '{ "my":"json2"}'
    },
    {
      applicant_id: '0000003',
      recruiter_id: 2,
      email: 'test2@hotmail.com',
      session: '{ "my":"json3"}'
    },
    {
      applicant_id: '0000004',
      recruiter_id: 2,
      email: 'test3@hotmail.com',
      session: '{ "my":"json4"}'
    }
  ]);
};

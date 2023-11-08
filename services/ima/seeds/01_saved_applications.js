'use strict';

// eslint-disable-next-line func-names
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('saved_applications').del()
    // eslint-disable-next-line func-names
    .then(function () {
      // Inserts seed entries
      return knex('saved_applications').insert([
        {
          email: 'test.dev@digital.homeoffice.gov.uk',
          uan: '1234-5645-8670-0000',
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        },
        {
          email: 'test.dev@digital.homeoffice.gov.uk',
          uan: '1784-0006-6790-7899',
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        }
      ]);
    });
};

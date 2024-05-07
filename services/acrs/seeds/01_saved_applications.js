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
          uan: '0000-0000-0000-0000',
          brp: null,
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        },
        {
          email: 'test.dev@digital.homeoffice.gov.uk',
          uan: '0000-0000-0000-0001',
          brp: null,
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        },
        {
          email: 'test.dev@digital.homeoffice.gov.uk',
          uan: null,
          brp: 'RZ0000000',
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        },
        {
          email: 'test.dev@digital.homeoffice.gov.uk',
          uan: null,
          brp: 'RZ0000001',
          date_of_birth: '2000/01/01',
          session: '{}',
          submitted_at: '2023/09/09'
        }
      ]);
    });
};

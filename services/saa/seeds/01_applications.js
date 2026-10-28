'use strict';

const daysAgo = days =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return (
    knex('applications')
      .del()
      .then(function () {
        // Inserts seed entries
        return knex('applications').insert([
          {
            // draft within the 7 day retention window
            uan: '1234567812345678',
            date_of_birth: '1990-01-01',
            email: 'test.dev@example.com',
            session: '{ "my": "draft" }',
            created_at: daysAgo(1),
            updated_at: daysAgo(1)
          },
          {
            // same UAN, different DOB - allowed by the unique constraint
            uan: '1234567812345678',
            date_of_birth: '1985-06-15',
            email: 'test.dev@example.com',
            session: '{ "my": "draft2" }',
            created_at: daysAgo(2),
            updated_at: daysAgo(2)
          },
          {
            // submitted within the 90 day retention window
            uan: '8765432187654321',
            date_of_birth: '2000-01-01',
            email: 'test2.dev@example.com',
            session: '{ "my": "submitted" }',
            submission_reference: 'SAA-0000001',
            created_at: daysAgo(30),
            updated_at: daysAgo(20),
            submitted_at: daysAgo(20)
          },
          {
            // expired draft - removed by the 7 day cron job
            uan: '1111222233334444',
            date_of_birth: '1975-12-31',
            email: 'test3.dev@example.com',
            session: '{ "my": "expired draft" }',
            created_at: daysAgo(8),
            updated_at: daysAgo(8)
          },
          {
            // expired submission - removed by the 90 day cron job
            uan: '5555666677778888',
            date_of_birth: '1995-03-20',
            email: 'test4.dev@example.com',
            session: '{ "my": "expired submitted" }',
            submission_reference: 'SAA-0000002',
            created_at: daysAgo(100),
            updated_at: daysAgo(91),
            submitted_at: daysAgo(91)
          }
        ]);
      })
  );
};

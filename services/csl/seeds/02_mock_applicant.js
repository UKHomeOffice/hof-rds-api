exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('applicants').del()
    .then(function () {
      // Inserts seed entries
      return knex('applicants').insert([
        {
          applicant_id: 1,
          username: 'test-approved'
        },
        {
          applicant_id: 2,
          username: 'test-external-user'
        },
        {
          applicant_id: 3,
          username: 'test2-approved'
        }
      ]);
    });
};

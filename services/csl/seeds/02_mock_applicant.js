exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('applicants').del()
    .then(function () {
      // Inserts seed entries
      return knex('applicants').insert([
        {
          applicant_id: 1,
          username: 'TEST-APPROVED'
        },
        {
          applicant_id: 2,
          username: 'TEST-EXTERNAL_USER'
        },
        {
          applicant_id: 3,
          username: 'TEST2-APPROVED'
        }
      ]);
    });
};

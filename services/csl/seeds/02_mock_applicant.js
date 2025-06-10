exports.seed = function (knex) {
  // Insert or update applicants
  return knex('applicants').insert([
    {
      applicant_id: 1,
      username: 'TEST-APPROVED'
    },
    {
      applicant_id: 2,
      username: 'TEST-EXTERNAL-USER'
    },
    {
      applicant_id: 3,
      username: 'TEST2-APPROVED'
    }
  ])
    .onConflict('applicant_id')
    .merge();
};

exports.seed = function (knex) {
  return knex('applicants')
    // Delete applicants not referenced in applications
    .whereNotIn('applicant_id', knex('applications').select('applicant_id'))
    .del()
    .then(function () {
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
    });
};

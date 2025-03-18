exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('applicants').del()
    .then(function () {
      // Inserts seed entries
      return knex('applicants').insert([
        {
          applicant_id: 1,
          username: 'test-approved'
        }
      ]);
    });
};
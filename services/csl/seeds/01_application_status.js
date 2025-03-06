exports.seed = function (knex) {
  // Deletes ALL existing entries and relations between saved_applications & recruiters
  return knex('application_status').del()
    .then(function () {
      // Inserts seed entries
      return knex('application_status').insert([
        {
          status_name: 'progress',
          description: 'This application is in progress and has not attempted submission'
        },
        {
          status_name: 'pending',
          description: 'This application has attempted submission but has not yet completed'
        },
        {
          status_name: 'complete',
          description: 'Application submitted with no errors'
        },
        {
          status_name: 'error',
          description: 'An error occured during application submission'
        }
      ]);
    });
};

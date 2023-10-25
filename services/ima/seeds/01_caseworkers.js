exports.seed = function (knex) {
  // Deletes ALL existing entries and relations between saved_applications & recruiters
  return knex('saved_applications').del()
    .then(async () => await knex('caseworkers').del())
    .then(function () {
      // Inserts seed entries
      return knex('caseworkers').insert([
        {email: 'caseworker-test@digital.homeoffice.gov.uk'},
        {email: 'caseworker-test2@digital.homeoffice.gov.uk'},
        {email: 'caseworker-test3@digital.homeoffice.gov.uk'},
        {email: 'caseworker-test4@digital.homeoffice.gov.uk'}
      ]);
    });
};

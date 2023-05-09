'use strict';

exports.seed = function (knex) {
  // Deletes ALL existing entries and relations between saved_applications & recruiters
  return knex('saved_applications').del()
    .then(async () => await knex('recruiters').del())
    .then(function () {
      // Inserts seed entries
      return knex('recruiters').insert([
        {email: 'recruiter-test@digital.homeoffice.gov.uk'},
        {email: 'recruiter-test2@digital.homeoffice.gov.uk'},
        {email: 'recruiter-test3@digital.homeoffice.gov.uk'}
      ]);
    });
};

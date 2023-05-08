'use strict';

exports.seed = function (knex) {
  // Deletes ALL existing entries and relations between saved_applications & recruiters
  return knex('saved_applications').del()
    .then(async () => await knex('recruiters').del())
    .then(function () {
      // Inserts seed entries
      return knex('recruiters').insert([
        {id: 1, email: 'recruiter-test@digital.homeoffice.gov.uk'},
        {id: 2, email: 'recruiter-test2@digital.homeoffice.gov.uk'},
        {id: 3, email: 'recruiter-test3@digital.homeoffice.gov.uk'}
      ]);
    });
};

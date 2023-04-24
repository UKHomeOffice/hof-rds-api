'use strict';

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('hof').del()
    .then(function () {
      // Inserts seed entries
      return knex('hof').insert([
        {type: 'nrm', ip: '192.168.0.1', success: 'true'},
        {type: 'dtn', ip: '192.168.0.1', success: 'false'},
        {type: 'referral', ip: '192.168.0.1', success: 'true'}
      ]);
    });
};

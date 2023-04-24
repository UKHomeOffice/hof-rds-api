
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('resolver').del()
    .then(function () {
      // Inserts seed entries
      return knex('resolver').insert([
        {success: 'true'},
        {success: 'false'},
        {success: 'true'}
      ]);
    });
};


const config = require('../config');
const knexfile = require(`../services/${config.serviceName}/knexfile.js`);
const knexfileConfig = knexfile[process.env.NODE_ENV ? 'production' : 'development'];
const knex = require('knex')(knexfileConfig);

const DEFAULT_PROPS = [
  'id',
  'created_at',
  'updated_at'
];

module.exports = class PostgresModel {
  constructor(tableName, selectableProps) {
    this.requestTimeout = config.requestTimeout;
    this.tableName = tableName;
    this.selectableProps = DEFAULT_PROPS.concat(selectableProps || []);
  }

  create(props) {
    return knex.insert(props)
      .returning(this.selectableProps)
      .into(this.tableName)
      .timeout(this.requestTimeout);
  }

  delete(id) {
    return knex(this.tableName)
      .where({ id })
      .del();
  }

  get(props) {
    return knex.select(this.selectableProps)
      .from(this.tableName)
      .where(props)
      .timeout(this.requestTimeout);
  }

  patch(id, props) {
    const fieldsToUpdate = Object.assign({}, props, {
      updated_at: knex.fn.now()
    });

    return knex(this.tableName).where({ id })
      .update(fieldsToUpdate)
      .returning(this.selectableProps)
      .timeout(this.requestTimeout);
  }
};

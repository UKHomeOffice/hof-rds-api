/* eslint-disable max-len */
const config = require('../config');
const _ = require('lodash');
const knexfileConfig = require('../knexfile.js')[config.env];
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

  getInTimeRange(props) {
    const selectableProps = props.selectableProps ?
      DEFAULT_PROPS.concat(props.selectableProps.split(',')) :
      this.selectableProps;

    if (props.withValue) {
      return knex.select(selectableProps)
        .from(this.tableName)
        .whereNotNull(props.withValue)
        .whereBetween(props.timestamp, [props.from, (props.to || knex.fn.now())])
        .timeout(this.requestTimeout);
    }
    return knex.select(selectableProps)
      .from(this.tableName)
      .whereBetween(props.timestamp, [props.from, (props.to || knex.fn.now())])
      .timeout(this.requestTimeout);
  }

  async getCount(props) {
    if (props.count && props.timestamp && props.from) {
      return await knex(this.tableName)
        .whereNotNull(props.count)
        .whereBetween(props.timestamp, [props.from, (props.to || knex.fn.now())])
        .count();
    } else if (props.timestamp && props.from) {
      return await knex(this.tableName)
        .whereBetween(props.timestamp, [props.from, (props.to || knex.fn.now())])
        .count();
    } else if (props.count) {
      return await knex(this.tableName)
        .whereNotNull(props.count)
        .count();
    }
    return await knex(this.tableName).count();
  }

  async getMetrics(props) {
    // TODO use knex to build these queries like it is meant to rather than this horrible raw SQL one liner
    const tsize = await knex.raw('select relname, pg_size_pretty(pg_total_relation_size(relname::regclass)) as full_size, pg_size_pretty(pg_relation_size(relname::regclass)) as table_size, pg_size_pretty(pg_total_relation_size(relname::regclass) - pg_relation_size(relname::regclass)) as index_size from pg_stat_user_tables order by pg_total_relation_size(relname::regclass) desc limit 10;');
    const tableSize = _.find(tsize.rows, obj => obj.relname === this.tableName).full_size;
    const dsize = await knex.raw('select datname, pg_size_pretty(pg_database_size(datname)) from pg_database order by pg_database_size(datname);');
    const databaseName = knexfileConfig.connection.database;
    const databaseSize = _.find(dsize.rows, obj => obj.datname === databaseName).pg_size_pretty;
    const count = await this.getCount(props);

    return {
      table_name: this.tableName,
      table_size: tableSize,
      database_name: databaseName,
      database_size: databaseSize,
      row_count: count[0].count
    };
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

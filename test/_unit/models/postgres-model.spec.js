'use strict';

const path = require('path');

describe('PostgresModel', () => {
  let proxyquire;

  before(() => {
    proxyquire = global.proxyquire;
  });

  const makeKnexFake = () => {
    const rec = {
      insertArgs: null,
      insertReturningArgs: null,
      insertIntoTable: null,
      selectArgs: null,
      selectFromTable: null,
      selectWhereArgs: null,
      selectWhereNotNullCol: null,
      selectWhereBetween: null,
      tableWhereArgs: null,
      updateArgs: null,
      updateReturningArgs: null
    };

    const insertChain = {
      returning: args => {
        rec.insertReturningArgs = args;
        return insertChain;
      },
      into: table => {
        rec.insertIntoTable = table;
        return insertChain;
      },
      timeout: () => Promise.resolve([{ id: 1 }])
    };

    const finalChain = {
      timeout: () => Promise.resolve([{ id: 1 }])
    };

    const selectWNChain = {
      whereBetween: (col, range) => {
        rec.selectWhereBetween = { col, range };
        return finalChain;
      }
    };

    const selectFromChain = {
      where: props => {
        rec.selectWhereArgs = props;
        return finalChain;
      },
      whereNotNull: col => {
        rec.selectWhereNotNullCol = col;
        return selectWNChain;
      },
      whereBetween: (col, range) => {
        rec.selectWhereBetween = { col, range };
        return finalChain;
      }
    };

    const selectChain = {
      from: table => {
        rec.selectFromTable = table;
        return selectFromChain;
      }
    };

    const tableChain = {
      where: props => {
        rec.tableWhereArgs = props;
        return {
          del: () => Promise.resolve(1),
          update: fields => {
            rec.updateArgs = fields;
            return {
              returning: args => {
                rec.updateReturningArgs = args;
                return { timeout: () => Promise.resolve([{ id: 1 }]) };
              }
            };
          }
        };
      },
      count: () => Promise.resolve([{ count: 0 }])
    };

    const knexFake = function (arg) {
      if (typeof arg === 'string') {
        return tableChain;
      }

      return tableChain;
    };

    knexFake.insert = props => {
      rec.insertArgs = props;
      return insertChain;
    };

    knexFake.select = args => {
      rec.selectArgs = args;
      return selectChain;
    };

    knexFake.fn = { now: () => 'NOW' };

    knexFake.__rec = rec;
    return knexFake;
  };

  const loadModel = (knexFake, configOverride = {}) => {
    const Model = proxyquire(
      path.join(process.cwd(), 'models/postgres-model.js'),
      {
        '../config': Object.assign(
          { env: 'test', requestTimeout: 5000 },
          configOverride
        ),
        '../knexfile.js': { test: {} },
        knex: () => knexFake
      }
    );
    return { Model, rec: knexFake.__rec };
  };

  it('should keep selectableProps as * when provided', () => {
    const knexFake = makeKnexFake();
    const { Model } = loadModel(knexFake);
    const model = new Model('saved_applications', ['*']);
    model.selectableProps.should.deep.equal(['*']);
  });

  it('should append defaults to selectableProps when not *', () => {
    const knexFake = makeKnexFake();
    const { Model } = loadModel(knexFake);
    const model = new Model('saved_applications', ['email']);
    model.selectableProps.should.deep.equal([
      'id',
      'created_at',
      'updated_at',
      'email'
    ]);
  });

  it('should create() with provided props and return using selectableProps', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('saved_applications', ['email']);

    const props = { email: 'test@example.com' };
    const result = await model.create(props);

    rec.insertArgs.should.deep.equal(props);
    rec.insertIntoTable.should.equal('saved_applications');
    rec.insertReturningArgs.should.deep.equal([
      'id',
      'created_at',
      'updated_at',
      'email'
    ]);
    result.should.be.an('array');
  });

  it('should delete() by id', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('saved_applications', ['*']);

    await model.delete(42);

    rec.tableWhereArgs.should.deep.equal({ id: 42 });
  });

  it('should get() using selectableProps and where props', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('saved_applications', ['email']);

    const props = { email: 'user@example.com' };
    const rows = await model.get(props);

    rec.selectArgs.should.deep.equal([
      'id',
      'created_at',
      'updated_at',
      'email'
    ]);
    rec.selectFromTable.should.equal('saved_applications');
    rec.selectWhereArgs.should.deep.equal(props);
    rows.should.be.an('array');
  });

  it('should getInTimeRange() with whereBetween only', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('saved_applications', ['*']);

    const q = { timestamp: 'created_at', from: '2026-02-01', to: '2026-02-05' };
    const rows = await model.getInTimeRange(q);

    rec.selectFromTable.should.equal('saved_applications');
    rec.selectWhereBetween.should.deep.equal({
      col: 'created_at',
      range: ['2026-02-01', '2026-02-05']
    });
    rows.should.be.an('array');
  });

  it('should getInTimeRange() with whereNotNull and whereBetween', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('applications', ['*']);

    const q = {
      withValue: 'submitted_at',
      timestamp: 'submitted_at',
      from: '2026-02-01',
      to: '2026-02-05'
    };
    const rows = await model.getInTimeRange(q);

    rec.selectFromTable.should.equal('applications');
    rec.selectWhereNotNullCol.should.equal('submitted_at');
    rec.selectWhereBetween.should.deep.equal({
      col: 'submitted_at',
      range: ['2026-02-01', '2026-02-05']
    });
    rows.should.be.an('array');
  });

  it('should patch() add updated_at and return using selectableProps', async () => {
    const knexFake = makeKnexFake();
    const { Model, rec } = loadModel(knexFake);
    const model = new Model('saved_applications', ['email']);

    const id = 7;
    const props = { email: 'patched@example.com' };
    const rows = await model.patch(id, props);

    rec.tableWhereArgs.should.deep.equal({ id });
    rec.updateArgs.should.have.property('email', 'patched@example.com');
    rec.updateArgs.should.have.property('updated_at');
    rec.updateReturningArgs.should.deep.equal([
      'id',
      'created_at',
      'updated_at',
      'email'
    ]);
    rows.should.be.an('array');
  });
});

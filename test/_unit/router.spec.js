'use strict';

const path = require('path');

describe('router expiry logic', () => {
  let proxyquire;

  before(() => {
    proxyquire = global.proxyquire;
  });

  const StubCalc = class {
    getRetentionEndDate(days, type, anchorDate) {
      return `${days}|${type}|${anchorDate}`;
    }
  };

  const buildAppHarness = () => {
    const routes = {};
    const app = {
      get: (p, h) => {
        routes[`GET ${p}`] = h;
      },
      post: (p, h) => {
        routes[`POST ${p}`] = h;
      },
      patch: (p, h) => {
        routes[`PATCH ${p}`] = h;
      },
      delete: (p, h) => {
        routes[`DELETE ${p}`] = h;
      }
    };
    return { app, routes };
  };

  const buildModelStub = records => {
    class Model {
      constructor() {}
      create() {
        return Promise.resolve(records);
      }
      get() {
        return Promise.resolve(records);
      }
      getInTimeRange() {
        return Promise.resolve(records);
      }
      patch() {
        return Promise.resolve(records);
      }
      delete() {
        return Promise.resolve();
      }
      getMetrics() {
        return Promise.resolve({});
      }
    }
    return Model;
  };

  const invokeRoute = async (
    handler,
    // eslint-disable-next-line no-unused-vars
    method = 'POST',
    bodyOrQuery = {},
    params = {}
  ) => {
    const req = {
      body: bodyOrQuery,
      params,
      query: bodyOrQuery
    };
    let jsonPayload;
    const res = {
      json: payload => {
        jsonPayload = payload;
      },
      send: payload => {
        jsonPayload = payload;
      },
      sendStatus: () => {}
    };
    const next = err => {
      throw err;
    };

    await handler(req, res, next);
    return jsonPayload;
  };

  it('should use 30 business days from submitted_at when submitted job exists', async () => {
    const record = {
      id: 1,
      created_at: '2026-02-01T00:00:00.000Z',
      submitted_at: '2026-02-03T00:00:00.000Z'
    };

    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*'],
      dataRetentionPeriodType: 'calendar',
      customCronJobs: [
        {
          dataRetentionFilter: 'submitted',
          dataRetentionInDays: '30',
          dataRetentionPeriodType: 'business'
        },
        {
          dataRetentionFilter: 'unsubmitted',
          dataRetentionInDays: '5',
          dataRetentionPeriodType: 'business'
        }
      ]
    });

    const handler = routes['POST /saved_applications'];
    const payload = await invokeRoute(handler, 'POST', record);

    payload.should.be.an('array');
    payload[0].should.have.property('expires_at');
    payload[0].expires_at.should.equal(`30|business|${record.submitted_at}`);
  });

  it('should use 5 business days from created_at when unsubmitted job exists', async () => {
    const record = {
      id: 2,
      created_at: '2026-02-01T00:00:00.000Z',
      submitted_at: null
    };

    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*'],
      customCronJobs: [
        {
          dataRetentionFilter: 'submitted',
          dataRetentionInDays: '30',
          dataRetentionPeriodType: 'business'
        },
        {
          dataRetentionFilter: 'unsubmitted',
          dataRetentionInDays: '5',
          dataRetentionPeriodType: 'business'
        }
      ]
    });

    const handler = routes['POST /saved_applications'];
    const payload = await invokeRoute(handler, 'POST', record);

    payload.should.be.an('array');
    payload[0].should.have.property('expires_at');
    payload[0].expires_at.should.equal(`5|business|${record.created_at}`);
  });

  it('should fall back to root window when no matching custom job exists', async () => {
    const record = {
      id: 3,
      created_at: '2026-02-01T00:00:00.000Z',
      submitted_at: '2026-02-03T00:00:00.000Z'
    };

    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'applications',
      selectableProps: ['*'],
      dataRetentionInDays: 10,
      dataRetentionPeriodType: 'calendar'
    });

    const handler = routes['POST /applications'];
    const payload = await invokeRoute(handler, 'POST', record);

    payload.should.be.an('array');
    payload[0].should.have.property('expires_at');
    payload[0].expires_at.should.equal(`10|calendar|${record.submitted_at}`);
  });

  it('should not set expires_at when no retention config is provided', async () => {
    const record = {
      id: 4,
      created_at: '2026-02-01T00:00:00.000Z'
    };

    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'generic_table',
      selectableProps: ['*']
    });

    const handler = routes['POST /generic_table'];
    const payload = await invokeRoute(handler, 'POST', record);

    payload.should.be.an('array');
    payload[0].should.not.have.property('expires_at');
  });

  it('should compute expiry on GET /:id using customCronJobs (unsubmitted=5d)', async () => {
    const record = {
      id: 11,
      created_at: '2026-02-01T00:00:00.000Z',
      submitted_at: null
    };

    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*'],
      customCronJobs: [
        {
          dataRetentionFilter: 'unsubmitted',
          dataRetentionInDays: '5',
          dataRetentionPeriodType: 'business'
        }
      ]
    });

    const handler = routes['GET /saved_applications/:id'];
    const payload = await invokeRoute(handler, 'GET', {}, { id: 11 });
    payload.should.be.an('array');
    payload[0].expires_at.should.equal(`5|business|${record.created_at}`);
  });

  it('should return 400 guidance on GET /history when query missing', async () => {
    const ModelStub = buildModelStub([]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*']
    });

    const handler = routes['GET /saved_applications/history'];
    const payload = await invokeRoute(handler, 'GET', {});
    payload.should.have.property('status', 400);
    payload.should.have.property('message');
  });

  it('should compute expiry on GET /history when query provided', async () => {
    const record = { id: 12, created_at: '2026-02-01T00:00:00.000Z' };
    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*'],
      dataRetentionInDays: 15,
      dataRetentionPeriodType: 'calendar'
    });

    const handler = routes['GET /saved_applications/history'];
    const payload = await invokeRoute(handler, 'GET', {
      timestamp: 'created_at',
      from: '2026-02-01'
    });
    payload.should.be.an('array');
    payload[0].expires_at.should.equal(`15|calendar|${record.created_at}`);
  });

  it('should decode hex email and compute expiry on additional resource route (unsubmitted=5d)', async () => {
    const record = { id: 13, created_at: '2026-02-01T00:00:00.000Z' };
    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*'],
      additionalGetResources: ['email'],
      customCronJobs: [
        {
          dataRetentionFilter: 'unsubmitted',
          dataRetentionInDays: '5',
          dataRetentionPeriodType: 'business'
        }
      ]
    });

    const hexEmail = Buffer.from('user@example.com').toString('hex');
    const handler = routes['GET /saved_applications/email/:email'];
    const payload = await invokeRoute(handler, 'GET', {}, { email: hexEmail });
    payload.should.be.an('array');
    payload[0].expires_at.should.equal(`5|business|${record.created_at}`);
  });

  it('should compute expiry on PATCH route with submitted fallback to default', async () => {
    const record = {
      id: 14,
      created_at: '2026-02-01T00:00:00.000Z',
      submitted_at: '2026-02-02T00:00:00.000Z'
    };
    const ModelStub = buildModelStub([Object.assign({}, record)]);
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'applications',
      selectableProps: ['*'],
      dataRetentionInDays: 10,
      dataRetentionPeriodType: 'calendar'
    });

    const handler = routes['PATCH /applications/:id'];
    const payload = await invokeRoute(handler, 'PATCH', record, { id: 14 });
    payload[0].expires_at.should.equal(`10|calendar|${record.submitted_at}`);
  });

  it('should call clearExpired on DELETE /clear route with route params', async () => {
    const ModelStub = buildModelStub([]);
    const called = { args: null };
    const router = proxyquire(path.join(process.cwd(), 'router.js'), {
      './lib/data_retention_window_calculator': StubCalc,
      './models/postgres-model': ModelStub,
      './db': {
        clearExpired: (...args) => {
          called.args = args;
          return Promise.resolve();
        }
      }
    });

    const { app, routes } = buildAppHarness();
    router(app, {
      modelName: 'postgres-model',
      tableName: 'saved_applications',
      selectableProps: ['*']
    });

    const handler =
      routes[
        'DELETE /saved_applications/clear/:status/:dateType/older/:days/:periodType'
      ];
    await invokeRoute(
      handler,
      'DELETE',
      {},
      {
        status: 'unsubmitted',
        dateType: 'created_at',
        days: '30',
        periodType: 'business'
      }
    );
    called.args.should.deep.equal([
      'saved_applications',
      '30',
      'business',
      'unsubmitted',
      'created_at'
    ]);
  });
});

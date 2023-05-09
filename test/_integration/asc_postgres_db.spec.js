'use strict';

const DB = require('../../db');
const api = require('../../server');

const supertest = require('supertest')(api);

const encodeEmail = email => Buffer.from(email).toString('hex');

describe('ASC service - Standard router with postgres model', () => {
  let db;

  beforeEach(async () => {
    db = new DB({
      env: 'test',
      bankHolidayApi: 'https://www.gov.uk/bank-holidays.json',
      serviceName: 'asc'
    });
    
    await db.rollback();
    await db.migrate();
    await db.knex.seed.run();
  });

  afterEach(async () => {
    await db.rollback();
  });

  describe('GET', () => {
    describe('/saved_applications', () => {
      it('single entry by encoded email', done => {
        const email = 'test@hotmail.com';
        supertest
          .get(`/saved_applications/email/${encodeEmail(email)}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(res => {
            const body = res.body;
            expect(body.length).to.eql(1);
            expect(body.map(o => o.applicant_id)).to.deep.eql(['0000001']);
            expect(body.map(o => o.recruiter_id)).to.deep.eql([1]);
            expect(body.map(o => o.email)).to.deep.eql(['test@hotmail.com']);
          })
          .end(done);
      });

      it('multiple entries by encoded email', done => {
        const email = 'test2@hotmail.com';
        supertest
          .get(`/saved_applications/email/${encodeEmail(email)}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(res => {
            const body = res.body;
            expect(body.length).to.eql(2);
            expect(body.map(o => o.applicant_id)).to.deep.eql(['0000002', '0000003']);
            expect(body.map(o => o.recruiter_id)).to.deep.eql([2, 2]);
            expect(body.map(o => o.email)).to.deep.eql(['test2@hotmail.com', 'test2@hotmail.com']);
          })
          .end(done);
      });

      it('single entry by ID', done => {
        supertest
          .get('/saved_applications/2')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(res => {
            const result = res.body[0];
            expect(res.body.length).to.eql(1);
            expect(result.id).to.eql(2);
            expect(result.applicant_id).to.eql('0000002');
            expect(result.recruiter_id).to.eql(2);
            expect(result.email).to.eql('test2@hotmail.com');
          })
          .end(done);
      });
    });

    describe('/recruiters', () => {
      it('single entry by encoded email', done => {
        const email = 'recruiter-test@digital.homeoffice.gov.uk';
        supertest
          .get(`/recruiters/email/${encodeEmail(email)}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(res => {
            const body = res.body;
            expect(body.length).to.eql(1);
            expect(body.map(o => o.email)).to.deep.eql([email]);
          })
          .end(done);
      });
    });
  });

  describe('POST', () => {
    describe('/recruiters', () => {
      it('adds a record if request body is valid', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .post('/recruiters')
          .send({
            email: 'new-recruiter-test@hotmail.com'
          });

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        expect(res.status).to.eql(200);
        expect(countBefore + 1).to.eql(countAfter);
      });

      it('does not add a duplicate email even if request body is valid', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .post('/recruiters')
          .send({
            email: 'recruiter-test@digital.homeoffice.gov.uk'
          });

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        expect(res.status).to.eql(500);
        expect(countBefore).to.eql(countAfter);
      });

      describe('Bad Request Body', () => {
        it('returns an error if the request body is empty', done => {
          supertest
            .post('/recruiters')
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });
      });
    });

    describe('/saved_applications', () => {
      it('adds a record if request body is valid', async () => {
        const resBefore = await db.knex('saved_applications').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .post('/saved_applications')
          .send({
            email: 'test@hotmail.com',
            session: '{}',
            recruiter_id: 1,
            applicant_id: '0000008'
          });

        const resAfter = await db.knex('saved_applications').count();
        const countAfter = +resAfter[0].count;

        expect(res.status).to.eql(200);
        expect(countBefore + 1).to.eql(countAfter);
      });

      describe('Bad Request Body', () => {
        it('returns an error if the request body is empty', done => {
          supertest
            .post('/saved_applications')
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });

        it('returns an error if the request body only has session data', done => {
          supertest
            .post('/saved_applications')
            .send({
              email: null,
              session: '{}',
              recruiter_id: null,
              applicant_id: null
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });

        it('returns an error if the request body only has email and session', done => {
          supertest
            .post('/saved_applications')
            .send({
              email: 'test@hotmail.com',
              session: '{}',
              recruiter_id: null,
              applicant_id: null
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });

        it('returns an error if the request body is missing recruiter ID', done => {
          supertest
            .post('/saved_applications')
            .send({
              email: 'test@hotmail.com',
              session: '{}',
              recruiter_id: null,
              applicant_id: '0000008'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });

        it('returns an error if the recruiter_id references an entry that doesn\'t exist', done => {
          supertest
            .post('/saved_applications')
            .send({
              email: 'test@hotmail.com',
              session: '{}',
              recruiter_id: 1000,
              applicant_id: '0000008'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect(res => {
              expect(res.status).to.eql(500);
            })
            .end(done);
        });
      });
    });
  });

  describe('PATCH', () => {
    describe('/recruiters', () => {
      it('updates a record with a new email', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .patch('/recruiters/1')
          .send({
            email: 'test@hotmail.com'
          });

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/recruiters/1');
        const body = getRes.body;

        expect(res.status).to.eql(200);
        expect(countBefore).to.eql(countAfter);
        expect(body.length).to.eql(1);
        expect(body[0].id).to.eql(1);
        expect(body[0].email).to.eql('test@hotmail.com');
      });

      it('does not update a record with a new email if it is not unique', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .patch('/recruiters/1')
          .send({
            email: 'recruiter-test2@digital.homeoffice.gov.uk'
          });

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/recruiters/1');
        const body = getRes.body;

        expect(res.status).to.eql(500);
        expect(countBefore).to.eql(countAfter);
        expect(body.length).to.eql(1);
        expect(body[0].id).to.eql(1);
        expect(body[0].email).to.eql('recruiter-test@digital.homeoffice.gov.uk');
      });
    });
    describe('/saved_applications', () => {
      it('updates a record with new session information', async () => {
        const resBefore = await db.knex('saved_applications').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest
          .patch('/saved_applications/1')
          .send({
            session: '{ "new":"info"}'
          });

        const resAfter = await db.knex('saved_applications').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/saved_applications/1');
        const body = getRes.body;

        expect(res.status).to.eql(200);
        expect(countBefore).to.eql(countAfter);
        expect(body.length).to.eql(1);
        expect(body[0].id).to.eql(1);
        expect(body[0].session).to.eql({ new: 'info' });
      });
    });
  });

  describe('DELETE', () => {
    describe('/recruiters', () => {
      it('deletes a record if it has no associated saved applications', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest.delete('/recruiters/3');

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/recruiters/3');
        const body = getRes.body;

        expect(res.status).to.eql(200);
        expect(countBefore - 1).to.eql(countAfter);
        expect(body.length).to.eql(0);
      });

      it('does not delete a record if it has associated saved applications', async () => {
        const resBefore = await db.knex('recruiters').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest.delete('/recruiters/1');

        const resAfter = await db.knex('recruiters').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/recruiters/1');
        const body = getRes.body;

        expect(res.status).to.eql(500);
        expect(countBefore).to.eql(countAfter);
        expect(body.length).to.eql(1);
      });
    });
    describe('/saved_applications', () => {
      it('deletes a record if it has no associated saved applications', async () => {
        const resBefore = await db.knex('saved_applications').count();
        const countBefore = +resBefore[0].count;

        const res = await supertest.delete('/saved_applications/1');

        const resAfter = await db.knex('saved_applications').count();
        const countAfter = +resAfter[0].count;

        const getRes = await supertest.get('/saved_applications/1');
        const body = getRes.body;

        expect(res.status).to.eql(200);
        expect(countBefore - 1).to.eql(countAfter);
        expect(body.length).to.eql(0);
      });
    });
  });
});

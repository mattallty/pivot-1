import * as supertest from 'supertest';

import * as app from '../../app';

describe('POST /error', () => {
  it('respond with 400', (done) => {
    supertest(app)
      .post('/error')
      .expect(400, done);
  });
});

describe('GET /error', () => {
  it('respond with 200', (done) => {
    supertest(app)
      .get('/error')
      .expect(200, done);
  });
});


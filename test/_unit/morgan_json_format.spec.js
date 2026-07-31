'use strict';

const format = require('../../lib/morgan_json_format');

describe('morgan JSON format', () => {
  const req = {};
  const res = {};

  it('should produce the same JSON shape as the previous morgan-json object format', () => {
    const tokens = {
      method: () => 'GET',
      url: () => '/saved_applications/1',
      status: () => '200',
      res: (request, response, field) => {
        field.should.equal('content-length');
        return '247';
      },
      'response-time': () => '12.345',
      date: (request, response, formatName) => {
        formatName.should.equal('iso');
        return '2026-07-23T15:42:41.382Z';
      }
    };

    format(tokens, req, res).should.equal(
      JSON.stringify({
        short: 'GET /saved_applications/1 200',
        length: '247',
        'response-time': '12.345 ms',
        timestamp: '2026-07-23T15:42:41.382Z'
      })
    );
  });

  it('should use morgan-json fallback values for missing tokens', () => {
    const tokens = {
      method: () => undefined,
      url: () => undefined,
      status: () => undefined,
      res: () => undefined,
      'response-time': () => undefined,
      date: () => undefined
    };

    format(tokens, req, res).should.equal(
      JSON.stringify({
        short: '- - -',
        length: '-',
        'response-time': '- ms',
        timestamp: '-'
      })
    );
  });
});

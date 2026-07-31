'use strict';

const tokenValue = (tokens, req, res, name, arg) => {
  const value = tokens[name](req, res, arg);
  return value || '-';
};

module.exports = (tokens, req, res) =>
  JSON.stringify({
    short: [
      tokenValue(tokens, req, res, 'method'),
      tokenValue(tokens, req, res, 'url'),
      tokenValue(tokens, req, res, 'status')
    ].join(' '),
    length: `${tokenValue(tokens, req, res, 'res', 'content-length')}`,
    'response-time': `${tokenValue(tokens, req, res, 'response-time')} ms`,
    timestamp: `${tokenValue(tokens, req, res, 'date', 'iso')}`
  });

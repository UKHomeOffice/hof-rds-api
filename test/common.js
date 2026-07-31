'use strict';

process.env.NODE_ENV = 'test';

const sinonChai = require('sinon-chai');

global.chai = require('chai').use(sinonChai.default || sinonChai);
global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');
global.proxyquire = require('proxyquire');

process.setMaxListeners(0);
process.stdout.setMaxListeners(0);

'use strict';

process.env.NODE_ENV = 'test';

global.chai = require('chai');
global.should = chai.should();
global.expect = chai.expect;

process.setMaxListeners(0);
process.stdout.setMaxListeners(0);

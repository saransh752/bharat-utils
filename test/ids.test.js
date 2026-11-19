'use strict';
const test = require('node:test');
const assert = require('node:assert');
const b = require('../src');

test('other government / business IDs', () => {
  assert.ok(b.isVoterId('ABC1234567'));
  assert.ok(!b.isVoterId('AB12345678'));
  assert.ok(b.isPassport('A1234567'));
  assert.ok(!b.isPassport('Q1234567'));
  assert.ok(b.isDrivingLicence('RJ14 2011 0012345'));
  assert.ok(!b.isDrivingLicence('RJ1418110012345'));
  assert.ok(b.isTAN('DELA12345B'));
  assert.ok(b.isCIN('L12345MH1995PLC123456'));
  assert.ok(!b.isCIN('X12345MH1995PLC123456'));
  assert.ok(b.isUdyam('UDYAM-RJ-17-0012345'));
  assert.ok(!b.isUdyam('UDYAM-RJ-17-001234'));
});

test('UPI', () => {
  assert.ok(b.isUPI('rahul.sharma@okaxis'));
  assert.ok(!b.isUPI('rahul@'));
  assert.ok(!b.isUPI('no-at-sign'));
  assert.deepStrictEqual(b.parseUPI('Rahul@OkAxis'), { username: 'Rahul', handle: 'okaxis' });
  assert.strictEqual(b.parseUPI('bad'), null);
});

test('vehicle numbers', () => {
  const v = b.parseVehicleNumber('RJ14AB1234');
  assert.strictEqual(v.state, 'Rajasthan');
  assert.strictEqual(v.rtoCode, '14');
  assert.strictEqual(b.parseVehicleNumber('DL 3C AF 1234').series, 'CAF');
  assert.strictEqual(b.parseVehicleNumber('22BH1234AA').type, 'bharat-series');
  assert.ok(!b.isVehicleNumber('XX14AB1234'));
  assert.ok(!b.isVehicleNumber('RJ14AB0000'));
  assert.ok(!b.isVehicleNumber('hello'));
});

test('IFSC bank lookup and PIN info', () => {
  assert.strictEqual(b.ifscBank('SBIN0001234'), 'State Bank of India');
  assert.strictEqual(b.ifscBank('hdfc0000001'), 'HDFC Bank');
  assert.strictEqual(b.ifscBank('ZZZZ0000001'), null);
  assert.strictEqual(b.ifscBank('bad'), null);
  const p = b.pincodeInfo('302001');
  assert.strictEqual(p.region, 'Rajasthan');
  assert.strictEqual(p.zone, 3);
  assert.strictEqual(b.pincodeInfo('403001').region, 'Goa');
  assert.strictEqual(b.pincodeInfo('110001').region, 'Delhi');
  assert.strictEqual(b.pincodeInfo('000000'), null);
});

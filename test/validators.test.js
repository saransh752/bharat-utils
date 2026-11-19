'use strict';
const test = require('node:test');
const assert = require('node:assert');
const b = require('../src');

test('Verhoeff check digit matches the textbook example (236 -> 2363)', () => {
  assert.strictEqual(b.verhoeffCheckDigit('236'), 3);
});

test('Aadhaar validation', () => {
  assert.ok(b.isAadhaar('2345 6789 0124'));
  assert.ok(b.isAadhaar('2345-6789-0124'));
  assert.ok(!b.isAadhaar('234567890123')); // bad checksum
  assert.ok(!b.isAadhaar('123456789012')); // cannot start with 0 or 1
  assert.ok(!b.isAadhaar('2345678901'));   // too short
  assert.ok(!b.isAadhaar(null));
  assert.strictEqual(b.maskAadhaar('234567890124'), 'XXXX XXXX 0124');
  assert.throws(() => b.maskAadhaar('123'));
});

test('PAN validation and holder type', () => {
  assert.ok(b.isPAN('ABCPE1234F'));
  assert.ok(b.isPAN(' abcpe1234f '));
  assert.ok(!b.isPAN('ABCXE1234F')); // X is not a valid holder type
  assert.ok(!b.isPAN('ABCPE12345'));
  assert.strictEqual(b.panHolderType('ABCPE1234F'), 'Individual');
  assert.strictEqual(b.panHolderType('AAACR1234F'), 'Company');
  assert.strictEqual(b.panHolderType('nope'), null);
});

test('GSTIN validation and parsing', () => {
  assert.ok(b.isGSTIN('27AAPFU0939F1ZV'));
  assert.ok(!b.isGSTIN('27AAPFU0939F1ZW')); // wrong check char
  assert.ok(!b.isGSTIN('99ZZZZZ0000Z1Z1')); // garbage
  const p = b.parseGSTIN('27AAPFU0939F1ZV');
  assert.strictEqual(p.state, 'Maharashtra');
  assert.strictEqual(p.pan, 'AAPFU0939F');
  assert.strictEqual(b.parseGSTIN('bad'), null);
});

test('IFSC, PIN code, mobile', () => {
  assert.ok(b.isIFSC('SBIN0001234'));
  assert.ok(b.isIFSC('hdfc0000001'));
  assert.ok(!b.isIFSC('SBIN1001234'));
  assert.ok(b.isPincode('302001'));
  assert.ok(!b.isPincode('012345'));
  assert.ok(!b.isPincode('30200'));
  assert.ok(b.isMobile('9876543210'));
  assert.ok(b.isMobile('+91 98765-43210'));
  assert.ok(b.isMobile('09876543210'));
  assert.ok(!b.isMobile('5876543210'));
  assert.strictEqual(b.normalizeMobile('098765 43210'), '+919876543210');
  assert.strictEqual(b.normalizeMobile('123'), null);
});

test('validate() dispatcher', () => {
  assert.strictEqual(b.validate('PAN', 'ABCPE1234F'), true);
  assert.strictEqual(b.validate('pincode', '000000'), false);
  assert.throws(() => b.validate('nope', 'x'), /Unknown type/);
});

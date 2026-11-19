'use strict';
const test = require('node:test');
const assert = require('node:assert');
const b = require('../src');

test('mask helpers', () => {
  assert.strictEqual(b.maskPAN('ABCPE1234F'), 'XXXXXX234F');
  assert.strictEqual(b.maskMobile('98765 43210'), 'XXXXX X3210');
  assert.strictEqual(b.maskEmail('rahul.sharma@gmail.com'), 'r***@gmail.com');
  assert.strictEqual(b.maskKeepLast('2345 6789 0124', 4), 'XXXX XXXX 0124');
});

test('findPII finds only validated identifiers', () => {
  const text = 'Aadhaar 2345 6789 0124 and random 2345 6789 0123 and PAN ABCPE1234F';
  const found = b.findPII(text);
  assert.deepStrictEqual(found.map((f) => f.type), ['aadhaar', 'pan']); // bad checksum ignored
});

test('redactPII masks everything sensitive', () => {
  const out = b.redactPII('Call +91 98765 43210, PAN ABCPE1234F, Aadhaar 2345 6789 0124, GST 27AAPFU0939F1ZV, mail rahul.sharma@gmail.com');
  assert.ok(!out.includes('ABCPE1234F'));
  assert.ok(!out.includes('2345 6789'));
  assert.ok(!out.includes('27AAPFU0939'));
  assert.ok(!out.includes('rahul.sharma'));
  assert.ok(out.includes('XXXX XXXX 0124'));
  assert.ok(out.includes('3210'));
});

test('redactPII respects the types option and leaves normal text alone', () => {
  const out = b.redactPII('PAN ABCPE1234F mail a@b.com', { types: ['pan'] });
  assert.ok(out.includes('a@b.com'));
  assert.ok(!out.includes('ABCPE1234F'));
  assert.strictEqual(b.redactPII('Nothing sensitive here: 12345'), 'Nothing sensitive here: 12345');
  assert.strictEqual(b.redactPII(null), '');
});

test('detectType', () => {
  assert.deepStrictEqual(b.detectType('ABCPE1234F'), ['pan']);
  assert.deepStrictEqual(b.detectType('9876543210'), ['mobile']);
  assert.deepStrictEqual(b.detectType('302001'), ['pincode']);
  assert.deepStrictEqual(b.detectType('hello world'), []);
  assert.deepStrictEqual(b.detectType(''), []);
});

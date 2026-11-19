'use strict';
const test = require('node:test');
const assert = require('node:assert');
const b = require('../src');
const { validateRequest } = require('../src/express');

test('validateData: normalizes, reports errors, supports Hindi', () => {
  const ok = b.validateData(
    { pan: ' abcpe1234f ', phone: '98765 43210', aadhaar: '2345-6789-0124' },
    { pan: 'pan', phone: { type: 'mobile' }, aadhaar: 'aadhaar' }
  );
  assert.strictEqual(ok.valid, true);
  assert.deepStrictEqual(ok.data, { pan: 'ABCPE1234F', phone: '+919876543210', aadhaar: '234567890124' });

  const bad = b.validateData({ mobile: '123' }, { mobile: 'mobile', pan: 'pan' });
  assert.strictEqual(bad.valid, false);
  assert.strictEqual(bad.errors.mobile, 'Invalid mobile number');
  assert.strictEqual(bad.errors.pan, 'PAN is required');

  const hi = b.validateData({ mobile: '123' }, { mobile: 'mobile' }, { lang: 'hi' });
  assert.strictEqual(hi.errors.mobile, 'अमान्य मोबाइल नंबर');

  const optional = b.validateData({}, { pan: { type: 'pan', required: false } });
  assert.strictEqual(optional.valid, true);

  const labelled = b.validateData({ p: 'x' }, { p: { type: 'pan', label: 'Tax ID' } });
  assert.strictEqual(labelled.errors.p, 'Invalid Tax ID');

  assert.throws(() => b.validateData({}, { x: 'nope' }), /Unknown type/);
});

test('express middleware', () => {
  const mw = validateRequest({ pan: 'pan', mobile: 'mobile' });

  let status, payload, nextCalled = false;
  const res = { status(s) { status = s; return this; }, json(p) { payload = p; return this; } };

  mw({ body: { pan: 'bad', mobile: '9876543210' } }, res, () => { nextCalled = true; });
  assert.strictEqual(status, 400);
  assert.ok(payload.errors.pan);
  assert.strictEqual(nextCalled, false);

  const req = { body: { pan: 'abcpe1234f', mobile: '9876543210' } };
  mw(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.validated, { pan: 'ABCPE1234F', mobile: '+919876543210' });
});

test('validate() supports every registered type', () => {
  assert.ok(b.SUPPORTED_TYPES.length >= 14);
  assert.strictEqual(b.validate('vehicle', 'RJ14AB1234'), true);
  assert.strictEqual(b.validate('UPI', 'a.b@okaxis'), true);
  assert.throws(() => b.validate('nope', 'x'), /Unknown type/);
});

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

test('extended detectors validate, preserve offsets and redact idempotently', () => {
  const samples = {
    aadhaar: '234567890124', upi: 'rahul@okhdfcbank', passport: 'A1234567',
    voterid: 'ABC1234567', card: '4111-1111-1111-1111', bankaccount: '9876543210',
    mobile: '8765432109', email: 'rahul@example.com',
  };
  const text = `UID:${samples.aadhaar}, pay ${samples.upi}; passport ${samples.passport}
Voter ${samples.voterid}; card ${samples.card}; खाता संख्या: ${samples.bankaccount}
Call ${samples.mobile} or email ${samples.email}. IFSC SBIN0001234`;
  const found = b.findPII(text);
  assert.deepStrictEqual(found.map(({ type, value }) => [type, value]), Object.entries(samples));
  for (const { value, start, end } of found) assert.strictEqual(text.slice(start, end), value);
  const redacted = b.redactPII(text);
  assert.match(redacted, /ra\*\*\*@okhdfcbank/);
  assert.match(redacted, /XXXX-XXXX-XXXX-1111/);
  assert.match(redacted, /खाता संख्या: XXXXXX3210/);
  assert.strictEqual(b.redactPII(redacted), redacted);
  assert.deepStrictEqual(b.findPII(text, { types: ['ifsc'] }).map(({ value }) => value), ['SBIN0001234']);
  assert.strictEqual(b.redactPII('SBIN0001234'), 'SBIN0001234');
  assert.strictEqual(b.redactPII('SBIN0001234', { types: ['ifsc'] }), 'XXXXXXX1234');
});

test('PII exclusions, overlap priorities and invalid candidates', () => {
  const typesOf = (text, options) => b.findPII(text, options).map(({ type }) => type);
  assert.deepStrictEqual(typesOf('account no. 4111 1111 1111 1111'), ['card']);
  assert.deepStrictEqual(typesOf('acct: 234567890124'), ['aadhaar']);
  assert.deepStrictEqual(typesOf('a/c 9876543210'), ['bankaccount']);
  assert.deepStrictEqual(typesOf('rahul@okhdfcbank.com'), ['email']);
  assert.deepStrictEqual(typesOf('9876543210', { exclude: ['mobile'] }), []);
  assert.deepStrictEqual(typesOf('9876543210', { types: ['mobile'], exclude: ['mobile'] }), []);
  assert.deepStrictEqual(typesOf('account: 1234567890123456789, 4111111111111112, X1234567, 123456789'), []);
  assert.deepStrictEqual(typesOf('A1234560 abc@x'), []);
  assert.strictEqual(b.maskUPI('rahul@okhdfcbank'), 'ra***@okhdfcbank');
  assert.strictEqual(b.maskPassport('A1234567'), 'XXXX4567');
  assert.strictEqual(b.maskVoterId('ABC1234567'), 'XXXXXX4567');
  assert.strictEqual(b.maskCard('4111 1111 1111 1111'), 'XXXX XXXX XXXX 1111');
  assert.strictEqual(b.maskBankAccount('123456789'), 'XXXXX6789');
});

test('overlapping masks cannot expose a fresh identifier on a second redaction', () => {
  const text = 'ABCPE1234F@example.com + rahul@test-9876543210.com';
  assert.deepStrictEqual(b.findPII(text).map(({ type }) => type), ['pan', 'email']);
  const redacted = b.redactPII(text);
  assert.strictEqual(redacted, 'X***@example.com + r***@test-XXXXXX3210.com');
  assert.strictEqual(b.redactPII(redacted), redacted);
});

test('card detection checks windows of complete digit groups', () => {
  const cases = [
    ['qty 2 4111111111111111', ['4111111111111111']],
    ['amount 500 4111 1111 1111 1111', ['4111 1111 1111 1111']],
    ['4111111111111111 4111111111111111', ['4111111111111111', '4111111111111111']],
    ['qty 2-4111111111111111', ['4111111111111111']],
    ['0000 0000 0000 0000 000', ['0000 0000 0000 0000 000']],
  ];
  for (const [text, cards] of cases) {
    const matches = b.findPII(text, { types: ['card'] });
    assert.deepStrictEqual(matches.map(({ value }) => value), cards);
    for (const { value, start, end } of matches) assert.strictEqual(text.slice(start, end), value);
  }
  assert.strictEqual(b.redactPII(cases[2][0]), 'XXXXXXXXXXXX1111 XXXXXXXXXXXX1111');
  for (const text of ['4111111111111112', 'order ID 1234567890123456', 'order ID 14111111111111111111']) {
    assert.strictEqual(b.redactPII(text, { types: ['card'] }), text);
  }
});

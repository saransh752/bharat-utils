import test from 'node:test';
import assert from 'node:assert';
import bharat, { isPAN, formatINR, redactPII } from '../index.mjs';

test('ESM named and default exports work', () => {
  assert.strictEqual(isPAN('ABCPE1234F'), true);
  assert.strictEqual(formatINR(100000), '₹1,00,000.00');
  assert.ok(!redactPII('ABCPE1234F').includes('ABCPE'));
  assert.strictEqual(typeof bharat.validate, 'function');
});

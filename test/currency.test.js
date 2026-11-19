'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { formatINR, numberToWords, amountInWords } = require('../src');

test('formatINR uses lakh/crore grouping', () => {
  assert.strictEqual(formatINR(0), '₹0.00');
  assert.strictEqual(formatINR(999), '₹999.00');
  assert.strictEqual(formatINR(1000), '₹1,000.00');
  assert.strictEqual(formatINR(100000), '₹1,00,000.00');
  assert.strictEqual(formatINR(1234567.5), '₹12,34,567.50');
  assert.strictEqual(formatINR(123456789), '₹12,34,56,789.00');
  assert.strictEqual(formatINR(-100000), '-₹1,00,000.00');
  assert.strictEqual(formatINR(1234567, { decimals: 0, symbol: 'Rs. ' }), 'Rs. 12,34,567');
  assert.throws(() => formatINR('abc'), TypeError);
});

test('numberToWords uses the Indian system', () => {
  assert.strictEqual(numberToWords(0), 'Zero');
  assert.strictEqual(numberToWords(7), 'Seven');
  assert.strictEqual(numberToWords(15), 'Fifteen');
  assert.strictEqual(numberToWords(100), 'One Hundred');
  assert.strictEqual(numberToWords(101), 'One Hundred One');
  assert.strictEqual(numberToWords(100000), 'One Lakh');
  assert.strictEqual(numberToWords(12345678), 'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight');
  assert.strictEqual(numberToWords(1000000000), 'One Hundred Crore');
  assert.strictEqual(numberToWords(-5), 'Minus Five');
});

test('amountInWords handles paise and rounding', () => {
  assert.strictEqual(amountInWords(1250.5), 'Rupees One Thousand Two Hundred Fifty and Fifty Paise Only');
  assert.strictEqual(amountInWords(100), 'Rupees One Hundred Only');
  assert.strictEqual(amountInWords(0.99), 'Rupees Zero and Ninety Nine Paise Only');
  assert.strictEqual(amountInWords(-10), 'Minus Rupees Ten Only');
});

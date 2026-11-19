'use strict';
const test = require('node:test');
const assert = require('node:assert');
const b = require('../src');

test('Hindi number words and amounts', () => {
  assert.strictEqual(b.numberToWords(0, { lang: 'hi' }), 'शून्य');
  assert.strictEqual(b.numberToWords(21, { lang: 'hi' }), 'इक्कीस');
  assert.strictEqual(b.numberToWords(100, { lang: 'hi' }), 'एक सौ');
  assert.strictEqual(b.numberToWords(100000, { lang: 'hi' }), 'एक लाख');
  assert.strictEqual(b.numberToWords(12345678, { lang: 'hi' }), 'एक करोड़ तेईस लाख पैंतालीस हज़ार छह सौ अठहत्तर');
  assert.strictEqual(b.amountInWords(1250.5, { lang: 'hi' }), 'एक हज़ार दो सौ पचास रुपये और पचास पैसे मात्र');
});

test('compact format and parsing', () => {
  assert.strictEqual(b.formatCompactINR(1250000), '₹12.5 L');
  assert.strictEqual(b.formatCompactINR(15000000), '₹1.5 Cr');
  assert.strictEqual(b.formatCompactINR(25000), '₹25 K');
  assert.strictEqual(b.formatCompactINR(999), '₹999');
  assert.strictEqual(b.formatCompactINR(-250000), '-₹2.5 L');
  assert.strictEqual(b.parseINR('₹12,34,567.50'), 1234567.5);
  assert.strictEqual(b.parseINR('Rs. 5,000'), 5000);
  assert.strictEqual(b.parseINR('1.5 crore'), 15000000);
  assert.strictEqual(b.parseINR('2 lakh'), 200000);
  assert.strictEqual(b.parseINR('50k'), 50000);
  assert.strictEqual(b.parseINR('-₹100'), -100);
  assert.strictEqual(b.parseINR('abc'), null);
  assert.strictEqual(b.parseINR(''), null);
});

test('GST calculator', () => {
  assert.deepStrictEqual(b.calculateGST(1000, 18), { base: 1000, rate: 18, cgst: 90, sgst: 90, igst: 0, totalTax: 180, total: 1180 });
  const inc = b.calculateGST(1180, 18, { inclusive: true });
  assert.strictEqual(inc.base, 1000);
  assert.strictEqual(inc.totalTax, 180);
  assert.strictEqual(inc.total, 1180);
  const inter = b.calculateGST(1000, 18, { interState: true });
  assert.strictEqual(inter.igst, 180);
  assert.strictEqual(inter.cgst, 0);
  assert.throws(() => b.calculateGST(-5), TypeError);
  assert.throws(() => b.calculateGST(100, 500), RangeError);
});

test('financial year', () => {
  assert.strictEqual(b.financialYear(new Date(2026, 10, 17)).label, '2026-27');
  assert.strictEqual(b.financialYear(new Date(2026, 10, 17)).quarter, 3);
  assert.strictEqual(b.financialYear(new Date(2027, 0, 15)).label, '2026-27');
  assert.strictEqual(b.financialYear(new Date(2027, 0, 15)).quarter, 4);
  assert.strictEqual(b.financialYear(new Date(2026, 2, 31)).label, '2025-26');
  assert.strictEqual(b.financialYear(new Date(2026, 3, 1)).quarter, 1);
  assert.strictEqual(b.financialYear(new Date(2026, 10, 17)).assessmentYear, '2027-28');
  assert.strictEqual(b.financialYear(new Date(1999, 5, 1)).label, '1999-00');
  assert.throws(() => b.financialYear('not a date'), TypeError);
  assert.strictEqual(b.parseFinancialYear('2026-27').startYear, 2026);
  assert.strictEqual(b.parseFinancialYear('2026-28'), null);
  assert.strictEqual(b.parseFinancialYear('junk'), null);
});

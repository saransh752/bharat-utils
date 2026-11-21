'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { findPII, redactPII } = require('../src');

const inputs = {
  letters: 'a'.repeat(200000),
  digits: '6'.repeat(200000),
  atSigns: 'a@'.repeat(100000),
  dots: 'a.'.repeat(100000),
  spacedDigits: '1 '.repeat(100000),
  repeatedFourDigitGroups: '4111-'.repeat(40000),
  repeatedCardGroups: '4111111111111111 '.repeat(11765).slice(0, 200000),
  base64: 'aBcdEF29+/'.repeat(20000),
  noTLD: 'a@' + 'a'.repeat(199998),
  dense: 'abc@example.com '.repeat(12500),
  accountWhitespace: 'account' + ' '.repeat(199993),
  separatedDigits: '4-'.repeat(100000),
};

for (const [shape, input] of Object.entries(inputs)) {
  test(`PII performance: ${shape}`, () => {
    for (const fn of [findPII, redactPII]) {
      const start = performance.now();
      fn(input);
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 500, `${fn.name} took ${elapsed.toFixed(1)} ms`);
    }
  });
}

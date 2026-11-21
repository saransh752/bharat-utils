'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { findPII, redactPII } = require('../src');

const repeat = (pattern) => (size) => pattern.repeat(Math.ceil(size / pattern.length)).slice(0, size);
const inputs = {
  letters: repeat('a'),
  digits: repeat('6'),
  atSigns: repeat('a@'),
  dots: repeat('a.'),
  spacedDigits: repeat('1 '),
  dashedDigits: repeat('4-'),
  spacedPairs: repeat('00 '),
  spacedTriples: repeat('000 '),
  repeatedFourDigitGroups: repeat('4111-'),
  repeatedCardGroups: repeat('4111111111111111 '),
  base64: repeat('aBcdEF29+/'),
  noTLD: (size) => 'a@' + 'a'.repeat(size - 2),
  dense: repeat('abc@example.com '),
  accountWhitespace: (size) => 'account' + ' '.repeat(size - 7),
};

function medianTime(fn, input) {
  const times = [];
  for (let run = 0; run < 3; run++) {
    const start = performance.now();
    fn(input);
    times.push(performance.now() - start);
  }
  return times.sort((a, b) => a - b)[1];
}

for (const [shape, makeInput] of Object.entries(inputs)) {
  test(`PII performance: ${shape}`, () => {
    const small = makeInput(200000);
    const large = makeInput(400000);
    for (const fn of [findPII, redactPII]) {
      const baseline = medianTime(fn, small);
      const doubled = medianTime(fn, large);
      const timing = `${fn.name} took ${baseline.toFixed(1)} ms at N and ${doubled.toFixed(1)} ms at 2N`;
      assert.ok(Math.max(baseline, doubled) < 3000, timing);
      if (baseline >= 20) assert.ok(doubled < 3.5 * baseline, timing);
    }
  });
}

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const b = require('../src');

test('Telangana retains both registration codes', () => {
  for (const code of ['TG', 'TS']) assert.equal(b.isVehicleNumber(code + '09AB1234'), true);
});

test('date-only inputs use local dates across timezones', () => {
  assert.throws(() => b.financialYear(null), { name: 'TypeError', message: 'Invalid date' });
  assert.equal(b.parseFinancialYear('2026-27').assessmentYear, '2027-28');
  for (const TZ of ['Asia/Kolkata', 'America/New_York', 'UTC', 'Pacific/Auckland']) {
    const child = spawnSync(process.execPath, ['-e', "console.log(require('./src').financialYear('2026-04-01').label)"], {
      cwd: path.join(__dirname, '..'), env: { ...process.env, TZ }, encoding: 'utf8',
    });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stdout.trim(), '2026-27', TZ);
  }
});

test('prototype keys are unknown types, and schema values must be scalar', () => {
  for (const type of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.throws(() => b.validate(type, 'x'), /Unknown type/);
    assert.throws(() => b.validateData({ x: 'x' }, { x: type }), /Unknown type/);
  }
  for (const x of [[], ['ABCPE1234F'], {}]) {
    assert.equal(b.validateData({ x }, { x: { type: 'pan', required: false } }).valid, false);
  }
  assert.equal(b.validateData({ pin: 302001 }, { pin: 'pincode' }).valid, true);
});

test('currency rounding and formatting input boundaries', () => {
  for (const [input, rounded] of [[1.005, '1.01'], [2.675, '2.68'], [1.255, '1.26'],
    [8.345, '8.35'], [0.07, '0.07'], [1.15, '1.15'], [99.999, '100.00']]) {
    assert.equal(b.formatINR(input), '₹' + rounded);
    assert.equal(b.amountInWords(input), b.amountInWords(Number(rounded)));
    assert.equal(b.amountInWords(input, { lang: 'hi' }), b.amountInWords(Number(rounded), { lang: 'hi' }));
    assert.equal(b.calculateGST(input, 0).base, Number(rounded));
  }
  assert.equal(b.formatINR(-0.001), '₹0.00');
  assert.equal(b.amountInWords(-0.001), 'Rupees Zero Only');
  assert.equal(b.amountInWords(0.5), 'Fifty Paise Only');
  assert.equal(b.amountInWords(1.005), 'Rupees One and One Paisa Only');
  assert.equal(b.amountInWords(0.5, { lang: 'hi' }), 'पचास पैसे मात्र');
  assert.equal(b.amountInWords(1.005, { lang: 'hi' }), 'एक रुपया और एक पैसा मात्र');
  for (const format of [b.formatINR, b.formatCompactINR]) {
    for (const value of [null, undefined, '', ' ', false, [], 'x']) assert.throws(() => format(value), TypeError);
    assert.throws(() => format(1e21), RangeError);
    for (const decimals of [-1, 21, 1.5, '2']) assert.throws(() => format(1, { decimals }), RangeError);
  }
  for (const rate of [null, '']) assert.throws(() => b.calculateGST(1000, rate), TypeError);
  assert.equal(b.calculateGST(1000, undefined).rate, 18);
  assert.equal(b.numberToWords(1e9), 'One Hundred Crore');
  assert.throws(() => b.numberToWords(1e15), /extended/);
  assert.equal(b.numberToWords(1e15 + 1e13 + 1e11 + 1e9, { extended: true }), 'One Padma One Neel One Kharab One Arab');
  assert.equal(b.numberToWords(1e15, { extended: true, lang: 'hi' }), 'एक पद्म');
  assert.throws(() => b.numberToWords(Number.MAX_SAFE_INTEGER + 1, { extended: true }), RangeError);
});

const cli = (...args) => spawnSync(process.execPath, [path.join(__dirname, '../bin/cli.js'), ...args], { encoding: 'utf8', timeout: 3000 });

test('CLI distinguishes invalid input, usage errors and help', () => {
  assert.equal(cli('validate', 'pan', 'ABCPE1234F').status, 0);
  assert.equal(cli('validate', 'pan', 'x').status, 1);
  assert.equal(cli('validate', 'constructor', 'x').status, 2);
  assert.equal(cli('validate').status, 2);
  const unknown = cli('unknown-command');
  assert.equal(unknown.status, 2);
  assert.match(unknown.stdout, /Usage:/);
  assert.equal(cli('--help').status, 0);
});

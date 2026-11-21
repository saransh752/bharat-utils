'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const b = require('../src');

test('custom schema checks see raw and normalized values, with localized overrides', () => {
  const pan = 'abcpe1234f';
  const verdict = b.validateData({ pan }, { pan: { type: 'pan', custom: (raw, clean) => raw === pan && clean === pan.toUpperCase() } });
  assert.deepEqual(verdict, { valid: true, errors: {}, data: { pan: 'ABCPE1234F' } });
  for (const [custom, message] of [
    [() => false, 'Invalid PAN'], [() => 'Ineligible', 'Ineligible'],
    [() => { throw Error('secret'); }, 'Invalid PAN'],
  ]) {
    const result = b.validateData({ pan }, { pan: { type: 'pan', custom } });
    assert.deepEqual(result, { valid: false, errors: { pan: message }, data: {} });
  }
  const schema = { pan: { type: 'pan', message: { en: 'Bad PAN', hi: 'गलत पैन' } } };
  assert.equal(b.validateData({}, schema).errors.pan, 'Bad PAN');
  assert.equal(b.validateData({ pan: 'x' }, schema, { lang: 'hi' }).errors.pan, 'गलत पैन');
  assert.equal(b.validateData({ pan }, { pan: { type: 'pan', custom: () => 'Custom', message: 'Override' } }).errors.pan, 'Override');
});

test('Fastify validates query, stops on failure and makes normalized data available', async () => {
  const { validateRequest } = require('bharat-utils/fastify');
  const handler = validateRequest({ pin: 'pincode' }, { source: 'query', lang: 'hi' });
  const req = { query: { pin: 302001 } };
  const reply = { code(status) { this.status = status; return this; }, send(body) { this.body = body; return this; } };
  await handler(req, reply);
  assert.deepEqual(req.validated, { pin: '302001' });
  await handler({ query: { pin: 'bad' } }, reply);
  assert.equal(reply.status, 400);
  assert.deepEqual(reply.body, { error: 'Validation failed', errors: { pin: 'अमान्य पिन कोड' } });
});

test('Koa validates body and route params through its normal context properties', async () => {
  const { validateRequest } = require('bharat-utils/koa');
  const handler = validateRequest({ pan: 'pan' });
  const ctx = { request: { body: { pan: 'abcpe1234f' } }, state: {} };
  await handler(ctx, async () => assert.deepEqual(ctx.state.validated, { pan: 'ABCPE1234F' }));
  ctx.request.body.pan = 'bad';
  await handler(ctx, async () => assert.fail('called next'));
  assert.equal(ctx.status, 400);
  assert.deepEqual(ctx.body, { error: 'Validation failed', errors: { pan: 'Invalid PAN' } });
  const params = { params: { pin: '302001' }, state: {} };
  await validateRequest({ pin: 'pincode' }, { source: 'params' })(params, async () => {});
  assert.deepEqual(params.state.validated, { pin: '302001' });
});

test('Express reports a missing parser before schema validation', () => {
  const { validateRequest } = require('bharat-utils/express');
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  validateRequest({ pin: 'pincode' })({}, res, () => assert.fail('called next'));
  assert.equal(res.code, 400);
  assert.match(res.body.error, /express\.json/);
  validateRequest({}, { source: 'query' })({}, res, () => assert.fail('called next'));
  assert.equal(res.body.error, 'Missing request query.');
});

test('regional words cover every sub-hundred value with representative known results', () => {
  for (const [lang, expected, amount] of [
    ['mr', 'पंचवीस', 'एक रुपया आणि पन्नास पैसे फक्त'],
    ['gu', 'પચ્ચીસ', 'એક રૂપિયો અને પચાસ પૈસા માત્ર'],
    ['ta', 'இருபத்து ஐந்து', 'ஒன்று ரூபாய் மற்றும் ஐம்பது பைசா மட்டும்'],
    ['bn', 'পঁচিশ', 'এক টাকা ও পঞ্চাশ পয়সা মাত্র'],
  ]) {
    assert.equal(b.numberToWords(25, { lang }), expected);
    assert.equal(b.amountInWords(1.5, { lang }), amount);
    const words = Array.from({ length: 100 }, (_, n) => b.numberToWords(n, { lang }));
    assert.equal(new Set(words).size, 100);
    assert.ok(words.every((word) => word && !word.includes('undefined')));
    assert.equal(b.amountInWords(-0.001, { lang }), b.amountInWords(0, { lang }));
    assert.ok(b.numberToWords(100001, { lang }).endsWith(words[1]));
    assert.ok(b.numberToWords(-25, { lang }).endsWith(expected));
    assert.throws(() => b.numberToWords(Infinity, { lang }), RangeError);
    assert.throws(() => b.amountInWords('x', { lang }), TypeError);
  }
  assert.equal(b.numberToWords(101, { lang: 'ta' }), 'நூற்று ஒன்று');
  assert.equal(b.numberToWords(900, { lang: 'ta' }), 'தொள்ளாயிரம்');
});

test('GST rates are indicative, HSN and SAC checks are format-only', () => {
  assert.deepEqual(b.GST_RATES, [0, 0.25, 3, 5, 18, 40]);
  assert.deepEqual(b.LEGACY_GST_RATES, [12, 28]);
  assert.equal(b.calculateGST(100, 12).total, 112);
  for (const valid of ['01', '1234', 123456, '01234567']) assert.equal(b.isHSN(valid), true);
  for (const invalid of [null, '123', '123456789', '12 34']) assert.equal(b.isHSN(invalid), false);
  assert.equal(b.isSAC(998314), true);
  assert.equal(b.isSAC('988314'), false);
  assert.equal(b.isSAC('9983140'), false);
});

test('TDS applies the configured threshold, rate and no-PAN floor', () => {
  assert.deepEqual(b.calculateTDS(1000, 2), { amount: 1000, rate: 2, tds: 20, net: 980 });
  assert.equal(b.calculateTDS(499, 2, { threshold: 500 }).tds, 0);
  assert.equal(b.calculateTDS(500, 2, { threshold: 500, hasPAN: false }).tds, 100);
  assert.equal(b.calculateTDS(500, 25, { hasPAN: false }).tds, 125);
  assert.throws(() => b.calculateTDS(-1, 2), RangeError);
  assert.throws(() => b.calculateTDS(100, 101), RangeError);
  assert.deepEqual(Object.keys(b.TDS_SECTIONS), ['194C', '194J', '194H', '194I', '194A', '194Q']);
});

test('income tax uses FY rules or caller-supplied slabs, with rebate before cess', () => {
  const rules = { fy: '2025-26' };
  assert.equal(b.calculateIncomeTax(1275000, rules).total, 0);
  assert.equal(b.calculateIncomeTax(1276000, rules).total, 1040);
  assert.equal(b.calculateIncomeTax(1675000, rules).total, 124800);
  assert.equal(b.calculateIncomeTax(550000, { ...rules, regime: 'old' }).rebate, 12500);
  const custom = b.calculateIncomeTax(110, {
    slabs: [[50, 0], [Infinity, 20]], standardDeduction: 10,
    rebate: { threshold: 100, max: 2 }, cess: 5,
  });
  assert.deepEqual(custom.slabs.map(({ taxable, tax }) => [taxable, tax]), [[50, 0], [50, 10]]);
  assert.deepEqual([custom.tax, custom.rebate, custom.cess, custom.total], [10, 2, 0.4, 8.4]);
  assert.throws(() => b.calculateIncomeTax(100, { fy: '2030-31' }), /Supply slabs/);
  assert.throws(() => b.calculateIncomeTax(100, { slabs: [[50, 0]] }), /cover/);
  assert.throws(() => b.calculateIncomeTax(100, { slabs: [[50, 0], [25, 10]] }), /increasing/);
  assert.throws(() => b.calculateIncomeTax(100, { regime: 'x' }), /regime/);
});

test('bank prefixes and indicative FY due dates', () => {
  assert.equal(b.ifscBank('AUBL0001234'), 'AU Small Finance Bank');
  assert.equal(b.ifscBank('TJSB0001234'), 'TJSB Sahakari Bank');
  assert.equal(b.ifscBank('TGRB0000262'), 'Telangana Grameena Bank');
  assert.equal(b.ifscBank('IPOS0000001'), 'India Post Payments Bank');
  assert.equal(b.ifscBank('DEUT0001234'), 'Deutsche Bank');
  assert.equal(b.quarterOf('2026-03-31'), 4);
  assert.equal(b.quarterOf('2026-04-01'), 1);
  assert.equal(b.isLeapFY('2023-24'), true);
  assert.equal(b.isLeapFY('2024-04-01'), false);
  assert.throws(() => b.isLeapFY('2023-25'), RangeError);
  for (const [type, length, first, last] of [
    ['gstr-1', 12, [2025, 4, 11], [2026, 3, 11]],
    ['gstr-3b', 12, [2025, 4, 20], [2026, 3, 20]],
    ['tds-deposit', 12, [2025, 4, 7], [2026, 3, 30]],
    ['tds-return', 4, [2025, 6, 31], [2026, 4, 31]],
    ['advance-tax', 4, [2025, 5, 15], [2026, 2, 15]],
  ]) {
    const dates = b.dueDates('2025-26', { type });
    assert.equal(dates.length, length);
    assert.deepEqual(dates[0], new Date(...first));
    assert.deepEqual(dates.at(-1), new Date(...last));
  }
  assert.throws(() => b.dueDates('bad', { type: 'gstr-1' }), /financial year/);
  assert.throws(() => b.dueDates('2025-26', { type: 'bad' }), /type/);
});

test('CLI new commands and language flag run in real subprocesses', () => {
  function cli(status, ...args) {
    const result = spawnSync(process.execPath, [join(__dirname, '../bin/cli.js'), ...args], { encoding: 'utf8' });
    assert.equal(result.status, status, result.stderr);
    return result.stdout.trim();
  }
  assert.equal(JSON.parse(cli(0, 'tds', '1000', '2')).tds, 20);
  assert.equal(JSON.parse(cli(0, 'tax', '1275000', '2025-26')).total, 0);
  assert.equal(JSON.parse(cli(0, 'tax', '550000', '2025-26', 'old')).total, 0);
  assert.equal(cli(0, 'due', '2025-26', 'advance-tax'), '2025-06-15\n2025-09-15\n2025-12-15\n2026-03-15');
  assert.match(cli(0, 'hsn', '0101'), /✔ valid/);
  assert.match(cli(1, 'hsn', '1'), /✘ invalid/);
  assert.equal(cli(0, 'words', '0.5', '--hi'), 'पचास पैसे मात्र');
  assert.equal(cli(0, 'words', '--lang', 'gu', '0.5'), 'પચાસ પૈસા માત્ર');
  cli(2, 'words', '1', '--lang');
});

test('tax year 2026-27 carries forward the 2025-26 rules in both regimes', () => {
  for (const regime of ['new', 'old']) {
    for (const income of [550000, 550001, 1275000, 1276000, 3000000]) {
      assert.deepEqual(
        b.calculateIncomeTax(income, { fy: '2026-27', regime }),
        b.calculateIncomeTax(income, { fy: '2025-26', regime }),
      );
    }
  }
});

test('regional wording supports magnitudes below 1e15', () => {
  for (const lang of ['mr', 'gu', 'ta', 'bn']) {
    for (const wording of [b.numberToWords, b.amountInWords]) {
      for (const sign of [-1, 1]) {
        assert.equal(typeof wording(sign * (1e15 - 1), { lang }), 'string');
        assert.throws(() => wording(sign * 1e15, { lang }), RangeError);
        assert.throws(() => wording(sign * (1e15 + 1), { lang, extended: true }), RangeError);
      }
    }
  }
});

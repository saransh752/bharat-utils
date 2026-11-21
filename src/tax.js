'use strict';

const { roundTo } = require('./_num');
const taxSlabs = require('./data/tax-slabs');

// Indicative rates. Verify with official GST notifications for the supply and date.
const GST_RATES = Object.freeze([0, 0.25, 3, 5, 18, 40]);
const LEGACY_GST_RATES = Object.freeze([12, 28]);

// The Income-tax Act, 2025 applies from 1 April 2026. It replaces the
// assessment year and previous year terminology with tax year and renumbers
// TDS provisions. These section numbers are historical references under the
// 1961 Act. Verify current provisions against the 2025 Act.
// Thresholds refer to annual totals unless otherwise stated.
const TDS_SECTIONS = {
  '194C': [
    { description: 'Contractor, individual or HUF, single payment', rate: 1, threshold: 30000 },
    { description: 'Contractor, other payee, single payment', rate: 2, threshold: 30000 },
  ],
  '194J': [
    { description: 'Professional services', rate: 10, threshold: 50000 },
    { description: 'Technical services (qualifying payments)', rate: 2, threshold: 50000 },
  ],
  '194H': [{ description: 'Commission or brokerage', rate: 2, threshold: 20000 }],
  '194I': [
    { description: 'Plant, machinery or equipment rent, monthly', rate: 2, threshold: 50000 },
    { description: 'Land, building, furniture or fittings rent, monthly', rate: 10, threshold: 50000 },
  ],
  '194A': [{ description: 'Bank interest, non-senior resident', rate: 10, threshold: 50000 }],
  '194Q': [{ description: 'Eligible purchases of goods, applies to excess over threshold', rate: 0.1, threshold: 5000000 }],
};

const code = (value) => String(value ?? '').trim();
const isHSN = (value) => /^(?:\d{2}){1,4}$/.test(code(value));
const isSAC = (value) => /^99\d{4}$/.test(code(value));

function nonNegative(value, name, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new RangeError(`Invalid ${name}`);
  }
  return value;
}

function calculateTDS(amount, rate, { hasPAN = true, threshold = 0 } = {}) {
  nonNegative(amount, 'amount');
  nonNegative(rate, 'rate', 100);
  nonNegative(threshold, 'threshold');
  const appliedRate = hasPAN ? rate : Math.max(rate, 20);
  const tds = amount < threshold ? 0 : roundTo(amount * (appliedRate / 100), 2);
  return { amount, rate: appliedRate, tds, net: roundTo(amount - tds, 2) };
}

// Estimator for slab-rate income. Verify before use. Surcharge and special-rate
// income are outside the scope of this engine.
function calculateIncomeTax(income, options = {}) {
  const { fy, regime = 'new', cess = 4 } = options;
  nonNegative(income, 'income');
  nonNegative(cess, 'cess', 100);
  if (regime !== 'new' && regime !== 'old') throw new RangeError('Unknown tax regime');
  const defaults = Object.hasOwn(taxSlabs, fy) ? taxSlabs[fy][regime] : {};
  const {
    slabs = defaults.slabs,
    standardDeduction = options.slabs ? 0 : defaults.standardDeduction ?? 0,
    rebate = options.slabs ? null : defaults.rebate,
  } = options;
  if (!Array.isArray(slabs) || !slabs.length) throw new RangeError('Supply slabs for this financial year and regime');
  nonNegative(standardDeduction, 'standard deduction');

  const taxableIncome = Math.max(0, roundTo(income - standardDeduction, 2));
  let from = 0;
  const breakdown = slabs.map(([upTo, rate], index) => {
    if (typeof upTo !== 'number' || !(upTo > from) || (upTo === Infinity && index !== slabs.length - 1)) {
      throw new RangeError('Slab limits must be strictly increasing');
    }
    nonNegative(rate, 'slab rate', 100);
    const taxable = Math.max(0, Math.min(taxableIncome, upTo) - from);
    const slab = { from, upTo, rate, taxable, tax: roundTo(taxable * (rate / 100), 2) };
    from = upTo;
    return slab;
  });
  if (taxableIncome > from) throw new RangeError('Slabs must cover taxable income');

  const tax = roundTo(breakdown.reduce((sum, slab) => sum + slab.tax, 0), 2);
  let relief = 0;
  if (rebate != null) {
    const { threshold, max, marginalRelief = false } = rebate;
    nonNegative(threshold, 'rebate threshold');
    nonNegative(max, 'maximum rebate');
    if (taxableIncome <= threshold) relief = Math.min(tax, max);
    else if (marginalRelief) relief = Math.max(0, roundTo(tax - (taxableIncome - threshold), 2));
  }
  const afterRebate = roundTo(tax - relief, 2);
  const cessAmount = roundTo(afterRebate * (cess / 100), 2);
  return { taxableIncome, standardDeduction, slabs: breakdown, tax, rebate: relief,
    cess: cessAmount, total: roundTo(afterRebate + cessAmount, 2) };
}

module.exports = { GST_RATES, LEGACY_GST_RATES, TDS_SECTIONS, isHSN, isSAC, calculateTDS, calculateIncomeTax };

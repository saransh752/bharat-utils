'use strict';

function roundTo(n, decimals) {
  if (!Number.isFinite(n) || n === 0) return n === 0 ? 0 : n;
  const [digits, exponent = '0'] = Math.abs(n).toString().split('e');
  const shifted = Number(digits + 'e' + (Number(exponent) + decimals));
  if (shifted >= Number.MAX_SAFE_INTEGER) return n;
  const rounded = Number(Math.round(shifted) + 'e-' + decimals);
  return rounded === 0 ? 0 : Math.sign(n) * rounded;
}

function splitAmount(n) {
  const rounded = roundTo(Math.abs(n), 2);
  if (rounded >= 1e21) return [rounded, 0];
  const [whole, fraction = ''] = rounded.toString().split('.');
  return [Number(whole), Number(fraction.padEnd(2, '0'))];
}

module.exports = { roundTo, splitAmount };

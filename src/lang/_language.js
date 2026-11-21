'use strict';

const { splitAmount } = require('../_num');

function createLanguage({ below100, hundred, scales, minus, rupees, paise, conjunction, only }) {
  function positive(n) {
    if (n < 100) return below100(n);
    if (n < 1000) {
      const rest = n % 100;
      return hundred(Math.floor(n / 100), rest !== 0) + (rest ? ' ' + below100(rest) : '');
    }
    const [size, name] = scales.find(([size]) => n >= size);
    const rest = n % size;
    return positive(Math.floor(n / size)) + ' ' + name + (rest ? ' ' + positive(rest) : '');
  }

  function numberToWords(value) {
    const n = Math.trunc(Number(value));
    if (!Number.isSafeInteger(n)) throw new RangeError('Number out of range');
    return (n < 0 ? minus + ' ' : '') + positive(Math.abs(n));
  }

  function amountInWords(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError('amountInWords expects a finite number');
    const [whole, fraction] = splitAmount(n);
    const parts = [];
    if (whole || !fraction) parts.push(numberToWords(whole) + ' ' + rupees[whole === 1 ? 0 : 1]);
    if (fraction) parts.push(below100(fraction) + ' ' + paise[fraction === 1 ? 0 : 1]);
    return (n < 0 && (whole || fraction) ? minus + ' ' : '') + parts.join(' ' + conjunction + ' ') + ' ' + only;
  }

  return { numberToWords, amountInWords };
}

module.exports = { createLanguage };

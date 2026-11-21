'use strict';

const { splitAmount } = require('./_num');

const H = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'];

function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(H[h] + ' सौ');
  if (r) parts.push(H[r]);
  return parts.join(' ');
}

/** Integer to Hindi words using the Indian system (हज़ार, लाख, करोड़). */
function numberToWordsHindi(value, options = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new RangeError('Number out of range');
  let n = Math.trunc(Math.abs(num));
  if (n > Number.MAX_SAFE_INTEGER) throw new RangeError('Number out of range');
  if (!options.extended && n >= 1e15) throw new RangeError('Use { extended: true } for numbers at or above 1e15');
  if (n === 0) return H[0];
  const parts = [];
  const scales = [[1e7, 'करोड़'], [1e5, 'लाख'], [1e3, 'हज़ार']];
  if (options.extended) scales.unshift([1e15, 'पद्म'], [1e13, 'नील'], [1e11, 'खरब'], [1e9, 'अरब']);
  for (const [size, name] of scales) {
    const q = Math.floor(n / size);
    if (q) {
      parts.push((size === 10000000 ? numberToWordsHindi(q) : H[q]) + ' ' + name);
      n %= size;
    }
  }
  if (n) parts.push(below1000(n));
  return (num < 0 ? 'ऋण ' : '') + parts.join(' ');
}

/** Cheque-style amount in Hindi: "एक हज़ार दो सौ पचास रुपये और पचास पैसे मात्र" */
function amountInWordsHindi(amount, options) {
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new TypeError('amountInWords expects a finite number');
  const [rupees, paise] = splitAmount(n);
  const cents = paise ? H[paise] + (paise === 1 ? ' पैसा' : ' पैसे') : '';
  const whole = rupees || !paise
    ? numberToWordsHindi(rupees, options) + (rupees === 1 ? ' रुपया' : ' रुपये')
    : '';
  const out = [whole, cents].filter(Boolean).join(' और ');
  return (n < 0 && (rupees || paise) ? 'ऋण ' : '') + out + ' मात्र';
}

module.exports = { numberToWordsHindi, amountInWordsHindi };

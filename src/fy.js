'use strict';

const pad2 = (n) => String(n % 100).padStart(2, '0');

function toDate(input) {
  if (input === null) throw new TypeError('Invalid date');
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split('-').map(Number);
    const local = new Date(0);
    local.setFullYear(year, month - 1, day);
    local.setHours(0, 0, 0, 0);
    if (local.getMonth() !== month - 1 || local.getDate() !== day) throw new TypeError('Invalid date');
    return local;
  }
  const d = input === undefined ? new Date() : new Date(input);
  if (Number.isNaN(d.getTime())) throw new TypeError('Invalid date');
  return d;
}

/**
 * Indian financial year (1 April - 31 March) details for a date.
 *   financialYear(new Date(2026, 10, 17))
 *   -> { label: '2026-27', assessmentYear: '2027-28', quarter: 3, ... }
 */
function financialYear(input) {
  const d = toDate(input);
  const m = d.getMonth(); // 0 = Jan
  const startYear = m >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const quarter = m >= 3 && m <= 5 ? 1 : m >= 6 && m <= 8 ? 2 : m >= 9 ? 3 : 4;
  return {
    startYear,
    endYear: startYear + 1,
    label: `${startYear}-${pad2(startYear + 1)}`,
    assessmentYear: `${startYear + 1}-${pad2(startYear + 2)}`,
    quarter,
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999),
  };
}

/** Start/end dates for a label like "2026-27". Returns null for invalid labels. */
function parseFinancialYear(label) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(label).trim());
  if (!m) return null;
  const startYear = Number(m[1]);
  if ((startYear + 1) % 100 !== Number(m[2])) return null;
  return {
    startYear,
    endYear: startYear + 1,
    label: `${startYear}-${m[2]}`,
    assessmentYear: `${startYear + 1}-${pad2(startYear + 2)}`,
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999),
  };
}

function quarterOf(date) {
  return financialYear(date).quarter;
}

function isLeapFY(input) {
  const fy = typeof input === 'string' && /^\d{4}-\d{2}$/.test(input.trim())
    ? parseFinancialYear(input)
    : financialYear(input);
  if (!fy) throw new RangeError('Invalid financial year');
  const year = fy.endYear;
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Indicative schedules. Verify with the official calendar before use.
// Monthly GST filers and ordinary non-government TDS deductors.
function dueDates(fyLabel, { type } = {}) {
  const fy = parseFinancialYear(fyLabel);
  if (!fy) throw new RangeError('Invalid financial year');
  const year = fy.startYear;
  switch (type) {
    case 'gstr-1':
    case 'gstr-3b':
    case 'tds-deposit':
      return Array.from({ length: 12 }, (_, i) => {
        const day = type === 'gstr-1' ? 11 : type === 'gstr-3b' ? 20 : i === 11 ? 30 : 7;
        return new Date(year, i + 4, day);
      });
    case 'tds-return':
      return [new Date(year, 6, 31), new Date(year, 9, 31),
        new Date(year + 1, 0, 31), new Date(year + 1, 4, 31)];
    case 'advance-tax':
      return [5, 8, 11, 14].map((month) => new Date(year, month, 15));
    default:
      throw new RangeError(`Unknown due date type "${type}"`);
  }
}

module.exports = { financialYear, parseFinancialYear, quarterOf, isLeapFY, dueDates };

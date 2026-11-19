'use strict';

const pad2 = (n) => String(n % 100).padStart(2, '0');

function toDate(input) {
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
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59, 999),
  };
}

module.exports = { financialYear, parseFinancialYear };

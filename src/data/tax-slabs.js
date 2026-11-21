'use strict';

// Indicative. Verify against the Income Tax Department before use.
// FY 2025-26 and tax year 2026-27, resident individual under 60,
// ordinary slab-rate income. The deduction assumes eligible salary or pension.
const rules = {
  new: {
    slabs: [[400000, 0], [800000, 5], [1200000, 10], [1600000, 15], [2000000, 20],
      [2400000, 25], [Infinity, 30]],
    standardDeduction: 75000,
    rebate: { threshold: 1200000, max: 60000, marginalRelief: true },
  },
  old: {
    slabs: [[250000, 0], [500000, 5], [1000000, 20], [Infinity, 30]],
    standardDeduction: 50000,
    rebate: { threshold: 500000, max: 12500 },
  },
};

module.exports = {
  '2025-26': rules,
  '2026-27': rules,
};

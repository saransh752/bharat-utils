# bharat-utils

[![npm version](https://img.shields.io/npm/v/bharat-utils)](https://www.npmjs.com/package/bharat-utils)
[![CI](https://github.com/saransh752/bharat-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/saransh752/bharat-utils/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
![Zero dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)
![TypeScript types included](https://img.shields.io/badge/TypeScript-types%20included-blue)

Validate Indian identifiers, redact PII, and handle INR, tax estimates, and Indian
financial years offline with a zero-dependency Node.js toolkit.

## Why this exists

Indian checkout, onboarding, and invoicing flows repeatedly need the same ID
checks, number formatting, and financial-year calculations. Support tickets and
application logs can also end up carrying identifiers that should be masked.
`bharat-utils` gives Node.js applications one offline API for these tasks, with
schema validation for Express, Fastify, and Koa.

## Install and quick start

Run `npm install bharat-utils` from your project. Then try this in a Node.js file.

```js
const b = require('bharat-utils');

console.log(b.isPAN('ABCPE1234F'));
// => true
console.log(b.redactPII('PAN ABCPE1234F'));
// => PAN XXXXXX234F
console.log(b.formatINR(1234567.5));
// => ₹12,34,567.50
```

## Feature tour

### Validators

```js
const b = require('bharat-utils');
const examples = {
  aadhaar: '234567890124', pan: 'ABCPE1234F', gstin: '27AAPFU0939F1ZV',
  ifsc: 'SBIN0001234', pincode: 302001, mobile: '+91 98765 43210',
  vehicle: 'TG09AB1234', voterid: 'ABC1234567', passport: 'A1234567',
  dl: 'RJ14 2011 0012345', tan: 'DELA12345B', cin: 'L12345MH1995PLC123456',
  udyam: 'UDYAM-RJ-17-0012345', upi: 'rahul@okhdfcbank',
};

console.log(Object.keys(examples).filter((type) => b.validate(type, examples[type])).join(', '));
// => aadhaar, pan, gstin, ifsc, pincode, mobile, vehicle, voterid, passport, dl, tan, cin, udyam, upi
```

### Parsers and lookups

```js
const b = require('bharat-utils');

console.log(b.parseGSTIN('27AAPFU0939F1ZV').state);
// => Maharashtra
console.log(b.parseVehicleNumber('TG09AB1234').state);
// => Telangana
console.log(b.parseUPI('Rahul@OkAxis').handle);
// => okaxis
console.log(b.ifscBank('SBIN0001234'));
// => State Bank of India
console.log(b.pincodeInfo(302001).region);
// => Rajasthan
console.log(b.panHolderType('AAACR1234F'));
// => Company
console.log(b.normalizeMobile('98765 43210'));
// => +919876543210
console.log(b.detectType('ABCPE1234F').join(', '));
// => pan
```

### PII detection and redaction

The default detectors cover GSTIN, Aadhaar, PAN, mobile, email, UPI, passport,
voter ID, payment cards, and contextual bank accounts. Cards must pass Luhn.
Bank account detection requires a preceding label such as `account no.`,
`acct`, `a/c`, or `खाता संख्या`. Add `ifsc` to `types` to mask public branch
information as well. `exclude` overrides the default or explicitly selected types.

```js
const b = require('bharat-utils');
const text = 'GST 27AAPFU0939F1ZV; UID:234567890124; PAN ABCPE1234F; 98765 43210; '
  + 'rahul@example.com; rahul@okhdfcbank; A1234567; ABC1234567; '
  + '4111-1111-1111-1111; खाता संख्या: 8765432109; SBIN0001234';

console.log(b.findPII(text).map(({ type }) => type).join(', '));
// => gstin, aadhaar, pan, mobile, email, upi, passport, voterid, card, bankaccount
console.log(b.redactPII(text));
// => GST XXXXXXXXXXXF1ZV; UID:XXXXXXXX0124; PAN XXXXXX234F; XXXXX X3210; r***@example.com; ra***@okhdfcbank; XXXX4567; XXXXXX4567; XXXX-XXXX-XXXX-1111; खाता संख्या: XXXXXX2109; SBIN0001234
console.log(b.redactPII('Branch SBIN0001234, card 4111111111111111', { types: ['ifsc', 'card'] }));
// => Branch XXXXXXX1234, card XXXXXXXXXXXX1111
console.log(b.redactPII('Reference 9876543210', { exclude: ['mobile'] }));
// => Reference 9876543210
```

### INR and amount wording

```js
const b = require('bharat-utils');

console.log(b.formatCompactINR(15000000));
// => ₹1.5 Cr
console.log(b.parseINR('1.5 crore'));
// => 15000000
for (const lang of ['en', 'hi', 'mr', 'gu', 'ta', 'bn']) {
  console.log(b.amountInWords(1.5, { lang }));
}
// => Rupees One and Fifty Paise Only
// => एक रुपया और पचास पैसे मात्र
// => एक रुपया आणि पन्नास पैसे फक्त
// => એક રૂપિયો અને પચાસ પૈસા માત્ર
// => ஒன்று ரூபாய் மற்றும் ஐம்பது பைசா மட்டும்
// => এক টাকা ও পঞ্চাশ পয়সা মাত্র
console.log(b.numberToWords(1e15 + 1e13 + 1e11 + 1e9, { extended: true }));
// => One Padma One Neel One Kharab One Arab
```

The formatters accept finite numbers and numeric strings with absolute value
below 1e21. Use `decimals` from 0 through 20. English and Hindi require
`extended: true` from 1e15 through `Number.MAX_SAFE_INTEGER`.

### GST, TDS, and income tax

```js
const b = require('bharat-utils');

console.log(JSON.stringify(b.calculateGST(1000, 18)));
// => {"base":1000,"rate":18,"cgst":90,"sgst":90,"igst":0,"totalTax":180,"total":1180}
console.log(JSON.stringify(b.calculateTDS(1000, 2)));
// => {"amount":1000,"rate":2,"tds":20,"net":980}
console.log(b.calculateIncomeTax(1675000, { fy: '2025-26' }).total);
// => 124800
console.log(b.calculateIncomeTax(100000, { slabs: [[50000, 0], [Infinity, 10]] }).total);
// => 5200
console.log(b.isHSN('0101'), b.isSAC('998314'));
// => true true
```

GST rates are percentages from 0 to 100. Pass `inclusive: true` to work back
from the total or `interState: true` to calculate IGST. The TDS threshold
applies to the entire input at or above the threshold, and `hasPAN: false`
sets a 20% minimum rate for this generic calculator. Verify section-specific
exceptions and bases before using it. The historical `TDS_SECTIONS` entries
are arrays of examples by payment category, with rates and thresholds for
FY 2025–26. Some statutory thresholds apply to aggregated payments or to
the excess above a limit.

The Income-tax Act, 2025 applies from 1 April 2026. It replaces the terms
assessment year and previous year with tax year and renumbers TDS provisions.
Use the historical section numbers in `TDS_SECTIONS` as references to the
1961 Act and verify current provisions against the 2025 Act.
[Income Tax Department guidance](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tax-payments-faq)

The bundled income tax estimates for FY 2025–26 and tax year 2026–27 cover ordinary slab-rate income
for a resident individual under 60. The default deduction assumes qualifying
salary or pension income. Set `standardDeduction: 0` when inapplicable. Pass
`rebate: null` when ineligible. The estimate covers slab tax, configured rebate
and marginal relief, and cess. Surcharge, special-rate income, and other
deductions require handling outside this helper. For other years, supply
`slabs` as increasing `[upperLimit, ratePercent]` pairs, ending with `Infinity`
to cover all incomes. With caller-supplied slabs, deduction and rebate apply
only when explicitly set.

### Financial year and filing dates

```js
const b = require('bharat-utils');
const fy = b.financialYear('2026-04-01');

console.log(fy.label, fy.assessmentYear, b.quarterOf('2026-04-01'));
// => 2026-27 2027-28 1
console.log(b.isLeapFY('2023-24'));
// => true
console.log(b.dueDates('2025-26', { type: 'advance-tax' }).map((date) => date.getDate()).join(', '));
// => 15, 15, 15, 15
```

Dates are local. Schedule types are `gstr-1`, `gstr-3b`, `tds-deposit`,
`tds-return`, and `advance-tax`. The GST examples assume monthly filing.
The TDS deposit schedule assumes an ordinary non-government deductor and uses
30 April for March deductions. Check applicability, holidays, and extensions
against the official filing calendar.

### Schema validation

A field is required by default. Set `required: false` to allow an omitted or
blank value. A synchronous `custom(raw, normalized)` callback runs after built-in
validation and normalization. Return `true` to accept, `false` to reject, or a
string to reject with that message. Thrown errors report an invalid field.
A rule-level `message` string or localized `{ en, hi }` takes precedence over
the callback’s message and the built-in message.

```js
const { validateData } = require('bharat-utils');
const schema = {
  phone: 'mobile',
  pin: {
    type: 'pincode',
    custom: (_raw, normalized) => normalized.startsWith('30') || 'Outside the service area',
  },
};

console.log(JSON.stringify(validateData({ pin: 302001, phone: '98765 43210' }, schema)));
// => {"valid":true,"errors":{},"data":{"phone":"+919876543210","pin":"302001"}}
console.log(JSON.stringify(validateData({ pin: 110001, phone: '98765 43210' }, schema).errors));
// => {"pin":"Outside the service area"}
```

### Express, Fastify, and Koa

Use Express and Koa validation as middleware after your body parser. In
Fastify, pass the returned function as the route’s `preHandler`.
Each adapter supports `source: 'body' | 'query' | 'params'` and English or
Hindi errors. Schema failures return HTTP 400 with `{ error, errors }`.

This example runs the handlers with plain objects so you can try the adapters
without installing a framework.

```js
const express = require('bharat-utils/express');
const fastify = require('bharat-utils/fastify');
const koa = require('bharat-utils/koa');
const schema = { pan: 'pan' };
const body = { pan: 'abcpe1234f' };

async function run() {
  const req = { body };
  express.validateRequest(schema)(req, {}, () => console.log(req.validated.pan));
  // => ABCPE1234F

  const request = { body };
  await fastify.validateRequest(schema)(request, {});
  console.log(request.validated.pan);
  // => ABCPE1234F

  const ctx = { request: { body }, state: {} };
  await koa.validateRequest(schema)(ctx, async () => console.log(ctx.state.validated.pan));
  // => ABCPE1234F
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
```

### CLI

Run the installed `bharat-utils` binary through your package runner or add
your project’s `node_modules/.bin` to PATH. Run it with `--help` for all
commands. Commands include `validate`, `detect`, `redact`, `format`, `compact`,
`words`, `gst`, `tds`, `tax`, `due`, `hsn`, and `fy`. The `words` command
accepts `--lang` or the `--hi` alias.

```sh
bharat-utils validate pan ABCPE1234F
# => ✔ valid
bharat-utils redact "PAN ABCPE1234F"
# => PAN XXXXXX234F
bharat-utils words 0.5 --lang hi
# => पचास पैसे मात्र
bharat-utils hsn 0101
# => ✔ valid
bharat-utils due 2025-26 advance-tax
# => 2025-06-15
# => 2025-09-15
# => 2025-12-15
# => 2026-03-15
```

## API reference

### Validators, parsers, and lookups

| Signature | Description |
| --- | --- |
| `isAadhaar(value) → boolean` | Checks the 12-digit format and Verhoeff checksum. |
| `verhoeffCheckDigit(digits) → number` | Computes the Verhoeff check digit. |
| `isPAN(value) → boolean` | Checks the PAN format and holder-type letter. |
| `panHolderType(value) → string \| null` | Looks up the PAN holder category. |
| `isGSTIN(value) → boolean` | Checks the format, state code, embedded PAN, and checksum. |
| `gstinCheckChar(first14) → string \| null` | Computes the GSTIN check character. |
| `parseGSTIN(value) → ParsedGSTIN \| null` | Returns the validated GSTIN and its components. |
| `STATE_CODES: Record<string, string>` | Maps GST state codes to names. |
| `isIFSC(value) → boolean` | Checks IFSC format. |
| `ifscBank(value) → string \| null` | Looks up the bank by IFSC prefix. |
| `BANKS: Record<string, string>` | Maps known IFSC prefixes to bank names. |
| `isPincode(value) → boolean` | Checks six-digit Indian PIN format. |
| `pincodeInfo(value) → PincodeInfo \| null` | Returns approximate PIN zone and region. |
| `isMobile(value) → boolean` | Checks Indian mobile format, with optional country or trunk prefix. |
| `normalizeMobile(value) → string \| null` | Emits a valid mobile number in `+91` format. |
| `isVoterId(value) → boolean` | Checks Voter ID EPIC format. |
| `isPassport(value) → boolean` | Checks Indian passport number format. |
| `isDrivingLicence(value) → boolean` | Checks the supported Indian driving licence format. |
| `isTAN(value) → boolean` | Checks TAN format. |
| `isCIN(value) → boolean` | Checks CIN format. |
| `isUdyam(value) → boolean` | Checks Udyam registration format. |
| `isUPI(value) → boolean` | Checks UPI virtual payment address format. |
| `parseUPI(value) → { username, handle } \| null` | Splits a valid UPI address. |
| `isVehicleNumber(value) → boolean` | Checks standard and Bharat-series registrations. |
| `parseVehicleNumber(value) → ParsedVehicle \| null` | Returns decoded vehicle registration components. |
| `VEHICLE_STATES: Record<string, string>` | Maps vehicle state codes to names. |
| `isHSN(value) → boolean` | Checks for 2, 4, 6, or 8 digits. |
| `isSAC(value) → boolean` | Checks for 6 digits beginning with 99. |
| `validate(type, value) → boolean` | Dispatches to a registered validator. Unknown types throw. |
| `detectType(value) → ValidatableType[]` | Lists possible registered types. |
| `SUPPORTED_TYPES: ValidatableType[]` | Lists supported validation type names. |
| `validateData(input, schema, { lang }?) → ValidationResult` | Validates fields and returns errors and normalized values. |

### Privacy

| Signature | Description |
| --- | --- |
| `findPII(text, { types, exclude }?) → PIIMatch[]` | Returns `{ type, value, start, end }` in text order, with an exclusive end offset. |
| `redactPII(text, { types, exclude }?) → string` | Replaces detected values with masks. |
| `maskAadhaar(value) → string` | Masks the first eight digits and groups the result in fours. |
| `maskKeepLast(value, keep = 4) → string` | Masks alphanumerics except the final `keep`, preserving separators. |
| `maskPAN(value) → string` | Keeps the final four PAN characters. |
| `maskGSTIN(value) → string` | Keeps the final four GSTIN characters. |
| `maskMobile(value) → string` | Keeps the final four mobile digits. |
| `maskEmail(value) → string` | Keeps one local-part character and the domain. |
| `maskUPI(value) → string` | Keeps up to two username characters and the handle. |
| `maskPassport(value) → string` | Keeps the final four passport characters. |
| `maskVoterId(value) → string` | Keeps the final four Voter ID characters. |
| `maskCard(value) → string` | Keeps the final four digits and separators. |
| `maskBankAccount(value) → string` | Keeps the final four account digits. |

### Money and tax

| Signature | Description |
| --- | --- |
| `formatINR(amount, { symbol, decimals }?) → string` | Formats with Indian digit grouping. |
| `formatCompactINR(amount, { symbol, decimals }?) → string` | Abbreviates amounts with K, L, or Cr. |
| `parseINR(input) → number \| null` | Parses INR text and common magnitude suffixes. |
| `numberToWords(value, { lang, extended }?) → string` | Spells an integer in the selected language. |
| `amountInWords(amount, { lang, extended }?) → string` | Spells rupees and rounded paise. |
| `numberToWordsHindi(value, { extended }?) → string` | Spells an integer in Hindi. |
| `amountInWordsHindi(amount, { extended }?) → string` | Spells rupees and paise in Hindi. |
| `calculateGST(amount, rate = 18, { inclusive, interState }?) → GSTBreakup` | Computes base, CGST, SGST, IGST, and total. |
| `GST_RATES: readonly number[]` | Indicative post-rationalisation GST rate examples. |
| `LEGACY_GST_RATES: readonly number[]` | Lists the former 12% and 28% main slabs. |
| `TDS_SECTIONS: Record<string, TDSSection[]>` | Indicative TDS references by historical section. |
| `calculateTDS(amount, rate, { hasPAN, threshold }?) → TDSBreakup` | Returns the applied rate, deduction, and net amount. |
| `calculateIncomeTax(income, { fy, regime, slabs, standardDeduction, rebate, cess }?) → IncomeTaxBreakup` | Estimates slab tax, rebate, cess, and total. |

### Dates and framework adapters

| Signature | Description |
| --- | --- |
| `financialYear(date?) → FinancialYearInfo` | Returns FY and assessment-year labels, local boundaries, and quarter. |
| `parseFinancialYear(label) → ParsedFinancialYear \| null` | Parses an FY label into local boundaries and assessment year. |
| `quarterOf(date?) → 1 \| 2 \| 3 \| 4` | Returns the April-based financial quarter. |
| `isLeapFY(labelOrDate?) → boolean` | Checks whether the FY contains February 29. |
| `dueDates(fyLabel, { type }) → Date[]` | Builds an indicative local filing or payment schedule. |
| `bharat-utils/express: validateRequest(schema, { source, lang }?) → middleware` | Validates and writes `req.validated`. |
| `bharat-utils/fastify: validateRequest(schema, { source, lang }?) → preHandler` | Validates and writes `request.validated`. |
| `bharat-utils/koa: validateRequest(schema, { source, lang }?) → middleware` | Validates and writes `ctx.state.validated`. |

The ESM default export contains the same API as the named exports.
Type signatures and result shapes are in [index.d.ts](./index.d.ts).

## Accuracy and legal notes

- **Identifiers.** These checks cover format and, where implemented, checksums.
  Use the relevant authority or payment provider to verify issuance, account
  ownership, identity, or status.
- **Aadhaar.** Section 29 of the Aadhaar Act restricts public display and
  disclosure. UIDAI’s sharing regulations require confidentiality and
  redaction in public records. Avoid logging full numbers, and use
  `maskAadhaar` to retain only the final four digits where retention is
  appropriate for your use case. [Aadhaar Act](https://uidai.gov.in/en/aadhaar-act)
  · [UIDAI sharing regulations](https://uidai.gov.in/images/The_Aadhaar_Sharing_of_information_regulation_2016.pdf)
- **Lookups.** PIN regions are approximate. Bank prefix mappings are indicative.
  Verify branch routing details with the bank or official directory.
  [NPCI member bank list](https://www.npci.org.in/product/nach/all-members)
- **Tax and calendars.** GST rates, TDS references, income tax defaults, and
  due dates are indicative. Verify GST rates against official notifications
  for the supply and date. Verify TDS rates, thresholds, and exceptions with
  the Income Tax Department. The dates include recurring deadlines without
  holiday or extension adjustments. Use the official calendar before filing
  or paying. Treat calculation outputs as estimates.
  [GST Council recommendations](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2163555&lang=2&reg=3)
  · [GST portal filing guide](https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf)
  · [Income Tax Department FY 2025–26 slabs](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?mobile-app=1)
  · [Tax payment FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tax-payments-faq)
- **Translations.** Marathi, Gujarati, Tamil, and Bengali number and currency
  wording is indicative and needs native-speaker review before it is used on
  customer-facing invoices or cheques.
- **PII false positives.** An unlabelled 10-digit account number beginning with
  6–9 can look like a mobile number. Use `exclude: ['mobile']` on account-heavy
  text if that tradeoff suits your use case. Format overlaps and unknown formats
  make free-text scanning heuristic. Minimize the sensitive data sent to logs.

## Security and performance

The package runs offline with zero dependencies and makes no network calls.
PII scanning regexes are designed for linear-time matching and have ReDoS
regression tests over 200,000-character inputs, including dense matches and
malformed email-like strings. Treat the raw values returned by `findPII` as
sensitive. See the [security policy](./SECURITY.md) for private reporting.

## Compatibility

Node.js 18 or later. CommonJS and ESM entry points, TypeScript declarations,
and a CLI are included. The HTTP adapters load without importing a framework.

## Contributing, changelog, and license

[Contributing](./CONTRIBUTING.md) · [Changelog](./CHANGELOG.md) · [MIT license](./LICENSE)

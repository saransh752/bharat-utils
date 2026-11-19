# bharat-utils 🇮🇳

> **Privacy-first toolkit for Indian apps.** Validate 14 ID types, redact sensitive data from text and logs, convert amounts to words in **English or Hindi**, format money in lakh/crore, calculate GST, work with financial years, and validate API requests with Express middleware.
> **Zero dependencies · TypeScript types · CJS + ESM · CLI included.**

```bash
npm install bharat-utils
```

## Why this exists

Every app built for India re-implements the same things: Aadhaar/PAN/GSTIN checks, `₹12,34,567` formatting, amount-in-words for invoices, financial-year logic. Worse, logs and support tickets end up full of **Aadhaar numbers, PANs and phone numbers** that should never be stored in plain text.

`bharat-utils` puts all of this in one small, tested package. Everything runs **offline** (no network calls, no data collection), and validators use **real checksums** (Verhoeff for Aadhaar, mod-36 for GSTIN), not just regexes.

## Quick tour

```js
const b = require('bharat-utils');         // or: import * as b from 'bharat-utils'

// 1. Validate (14 types)
b.isAadhaar('2345 6789 0124');          // true  (Verhoeff checksum)
b.isGSTIN('27AAPFU0939F1ZV');           // true  (state + PAN + checksum)
b.isPAN('ABCPE1234F');                  // true
b.validate('vehicle', 'RJ14 AB 1234');  // true
b.detectType('ABCPE1234F');             // ['pan']

// 2. Parse
b.parseGSTIN('27AAPFU0939F1ZV');   // { state: 'Maharashtra', pan: 'AAPFU0939F', ... }
b.parseVehicleNumber('DL3CAF1234');// { state: 'Delhi', rtoCode: '3', series: 'CAF', ... }
b.ifscBank('HDFC0000001');         // 'HDFC Bank'
b.pincodeInfo('302001');           // { region: 'Rajasthan', zone: 3, ... }
b.panHolderType('AAACR1234F');     // 'Company'

// 3. Privacy: redact PII before logging
b.redactPII('PAN ABCPE1234F, Aadhaar 2345 6789 0124, call 98765 43210');
// 'PAN XXXXXX234F, Aadhaar XXXX XXXX 0124, call XXXXX X3210'

// 4. Money
b.formatINR(1234567.5);                 // '₹12,34,567.50'
b.formatCompactINR(15000000);           // '₹1.5 Cr'
b.parseINR('1.5 crore');                // 15000000
b.amountInWords(1250.5);                // 'Rupees One Thousand Two Hundred Fifty and Fifty Paise Only'
b.amountInWords(1250.5, { lang: 'hi' });// 'एक हज़ार दो सौ पचास रुपये और पचास पैसे मात्र'
b.calculateGST(1000, 18);               // { cgst: 90, sgst: 90, igst: 0, total: 1180, ... }

// 5. Financial year
b.financialYear(new Date(2026, 10, 17));// { label: '2026-27', assessmentYear: '2027-28', quarter: 3, ... }
```

## Validate whole forms

```js
const result = b.validateData(
  { pan: ' abcpe1234f ', mobile: '98765 43210' },
  { pan: 'pan', mobile: 'mobile', upi: { type: 'upi', required: false } },
  { lang: 'en' }                         // 'hi' for Hindi error messages
);
// { valid: true, errors: {}, data: { pan: 'ABCPE1234F', mobile: '+919876543210' } }
```

## Express middleware

```js
const { validateRequest } = require('bharat-utils/express');

app.post('/kyc', express.json(),
  validateRequest({ pan: 'pan', mobile: 'mobile', ifsc: 'ifsc' }),
  (req, res) => res.json(req.validated)     // normalized values
);
// invalid input -> 400 { error: 'Validation failed', errors: { pan: 'Invalid PAN' } }
```

## CLI

```bash
npx bharat-utils validate pan ABCPE1234F
npx bharat-utils detect 27AAPFU0939F1ZV
npx bharat-utils redact "PAN ABCPE1234F, call 98765 43210"
cat server.log | npx bharat-utils redact > clean.log     # scrub a whole log file
npx bharat-utils words 1250.50 --hi
npx bharat-utils gst 1000 18
npx bharat-utils fy
```

## API reference

| Area | Functions |
|---|---|
| **Validators** | `isAadhaar` `isPAN` `isGSTIN` `isIFSC` `isPincode` `isMobile` `isVehicleNumber` `isVoterId` `isPassport` `isDrivingLicence` `isTAN` `isCIN` `isUdyam` `isUPI` |
| **Parsers / lookup** | `parseGSTIN` `parseVehicleNumber` `parseUPI` `ifscBank` `pincodeInfo` `panHolderType` `normalizeMobile` |
| **Privacy** | `findPII` `redactPII` `maskAadhaar` `maskPAN` `maskGSTIN` `maskMobile` `maskEmail` `maskKeepLast` |
| **Money** | `formatINR` `formatCompactINR` `parseINR` `numberToWords` `amountInWords` `calculateGST` (+ Hindi via `{ lang: 'hi' }`) |
| **Dates** | `financialYear` `parseFinancialYear` |
| **Helpers** | `validate(type, value)` `detectType(value)` `validateData(data, schema)` `SUPPORTED_TYPES` |
| **Express** | `require('bharat-utils/express').validateRequest(schema, { source, lang })` |

Supported `type` names: `aadhaar, pan, gstin, ifsc, pincode, mobile, vehicle, voterid, passport, dl, tan, cin, udyam, upi`.

## Privacy & legal notes

- The library makes **no network requests**, writes nothing to disk and logs nothing.
- Validation checks that a value is **well-formed** (format + checksum where one exists). It **cannot** prove an ID was issued to a real person; use official verification services for that.
- Aadhaar numbers are sensitive. Indian law restricts how they may be collected and stored. Prefer masking (`maskAadhaar`, `redactPII`) and avoid storing full numbers unless you are legally permitted to.
- Lookups (`pincodeInfo`, `ifscBank`, vehicle states) are **offline and approximate**: PIN prefixes can straddle state borders, and the bank list covers major banks only.
- Driving-licence and Udyam checks are format-level; older licence formats may not match.

## Tests

```bash
npm test      # 26 tests, uses Node's built-in test runner
```

## License

MIT

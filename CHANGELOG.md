# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [1.1.1] - 2026-11-21

### Added

- Income tax estimates for tax year 2026–27 using the same slabs, standard deductions, and rebates as FY 2025–26.

### Fixed

- Detect Luhn-valid cards next to other numbers separated by a single space or dash.
- Redact identifiers adjacent to underscores.
- Reject invalid GST amount types and blank strings.
- Enforce a magnitude limit below 1e15 for Marathi, Gujarati, Tamil, and Bengali wording.

### Known issues

- Marathi, Gujarati, Tamil, and Bengali wording is experimental, pending native-speaker review.

## [1.1.0] - 2026-11-21

### Fixed

- Prevented quadratic email scanning and removed repeated scans of previous PII matches.
- Recognized Telangana registrations starting with TG and retained TS support.
- Corrected local financial-year boundaries and prototype-key validation errors.
- Unified decimal rounding and corrected rupee and paisa wording.
- Reported missing Express request sources and corrected CLI help and exit statuses.

### Added

- UPI, passport, voter ID, payment card, and contextual bank account detection and masking.
- Opt-in IFSC detection and PII exclusions.
- Fastify and Koa adapters, schema callbacks, and localized message overrides.
- Marathi, Gujarati, Tamil, and Bengali amount wording and extended English and Hindi scale names.
- HSN and SAC format checks, GST rate references, and TDS and income tax estimators.
- Additional offline bank prefixes, financial-year quarter and leap-year helpers, and indicative due dates.
- CLI commands for TDS, income tax, due dates, and HSN, plus a language flag.
- CI across Node versions and timezones, coverage and package checks, and a tagged release workflow.

### Changed

- Raised the minimum supported Node.js version to 18.
- Updated the README with executable examples and documented data limitations.

### Behaviour changes

- Date-only strings use the host timezone and impossible date-only strings and `null` throw.
  Parsed financial years include `assessmentYear`.
- Unknown validation types consistently throw an `Unknown type` error. Schema validation
  rejects object and array field values, including empty arrays for optional fields.
- INR formatters reject unsupported inputs, amounts at or above 1e21, and invalid
  decimal precision. Compact formatting accepts a precision option.
- Decimal ties round away from zero and amounts that round to zero lose the negative sign.
  Amounts below one rupee show only paise when nonzero. English uses singular
  “Paisa” and Hindi uses singular “रुपया” and “पैसा” where appropriate.
- English and Hindi number wording requires `extended: true` at 1e15 and above.
  GST rates supplied as `null` or a blank string throw.
- Default PII scanning detects more identifiers. Cards can take priority over Aadhaar
  and contextual bank accounts take priority over mobile numbers. Redaction also masks
  lower-priority identifiers exposed by a preceding mask.
- Express responds with a missing-source error when the configured request property is undefined.
- Invalid CLI validation returns status 1. Unknown commands, bad usage, and command errors
  return status 2. Interactive `redact` with no text shows help.

## [1.0.0]

- Initial release.

[1.1.1]: https://github.com/saransh752/bharat-utils/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/saransh752/bharat-utils/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/saransh752/bharat-utils/releases/tag/v1.0.0

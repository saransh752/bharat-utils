# Contributing

Use Node.js 18 or later. Run `npm test` for correctness and
`npm run test:coverage` for branch coverage. The package uses Node’s built-in
test runner and has zero runtime and development dependencies.

## Add an ID type

Add the format validator and normalizer in `src/`, then register the type
and its English and Hindi labels in `src/registry.js`. Update the public
CommonJS, ESM, and TypeScript entry points and the README. Add tests for
valid, invalid, and boundary values. If it is detected in free text, also test
overlaps, masking, and adversarial inputs in the PII suite.

## Add an amount-in-words language

Add a module under `src/lang/` with the shared language interface, register
it in `src/currency.js`, and update `LangOptions` and the CLI language choices.
Test the complete 0–99 range, scale names, currency forms, and rounding.
Ask a native speaker to review the wording and document the supported variant.

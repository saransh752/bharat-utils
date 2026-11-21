'use strict';

const { validateData } = require('./schema');

function validateRequest(schema, { source = 'body', lang = 'en' } = {}) {
  return async function middleware(ctx, next) {
    const input = source === 'body' ? ctx.request.body : ctx[source];
    const { valid, errors, data } = validateData(input, schema, { lang });
    if (!valid) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', errors };
      return;
    }
    ctx.state.validated = data;
    return next();
  };
}

module.exports = { validateRequest };
